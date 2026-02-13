import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Subscription,
  SubscriptionCategory,
  BillingCycle,
  SubscriptionStatus,
} from '@/lib/types/subscription';
import { calculateMonthlyPrice } from '@/lib/calculations/costAnalysis';
import { supabase } from '@/lib/supabase';
import { ensureUserId } from '@/lib/auth/ensureUserId';

export interface AddSubscriptionInput {
  name: string;
  category: SubscriptionCategory;
  icon: string;
  billingCycle: BillingCycle;
  price: number;
  billingDay: number;
  status?: SubscriptionStatus;
  isShared?: boolean;
  sharedCount?: number;
  trialEndDate?: string;
  memo?: string;
  planName?: string;
}

export interface UpdateSubscriptionInput {
  name?: string;
  category?: SubscriptionCategory;
  icon?: string;
  billingCycle?: BillingCycle;
  price?: number;
  billingDay?: number;
  status?: SubscriptionStatus;
  isShared?: boolean;
  sharedCount?: number;
  trialEndDate?: string;
  memo?: string;
  planName?: string;
}

interface SubscriptionState {
  subscriptions: Subscription[];
  cancelledSubscriptions: Subscription[];

  // CRUD
  addSubscription: (input: AddSubscriptionInput) => Subscription;
  updateSubscription: (id: string, input: UpdateSubscriptionInput) => void;
  deleteSubscription: (id: string) => void;
  cancelSubscription: (id: string) => void;
  reactivateSubscription: (id: string) => void;

  // Reset (로그아웃 시 호출)
  reset: () => void;

  // Getters
  getSubscription: (id: string) => Subscription | undefined;
  getActiveSubscriptions: () => Subscription[];
  getByCategory: (category: SubscriptionCategory) => Subscription[];
  getTotalMonthlyCost: () => number;
  getTotalYearlyCost: () => number;
  getSubscriptionCount: () => number;
}

async function syncToSupabase(action: string, fn: (userId: string) => Promise<{ error: any }>) {
  try {
    const userId = await ensureUserId();
    if (!userId) {
      console.warn(`[Supabase] ${action} 건너뜀: user_id 없음`);
      return;
    }
    const { error } = await fn(userId);
    if (error) {
      console.error(`[Supabase] ${action} 실패:`, error.message);
    } else {
      console.log(`[Supabase] ${action} 성공`);
    }
  } catch (e) {
    console.error(`[Supabase] ${action} 에러:`, e);
  }
}

export const useSubscriptionStore = create<SubscriptionState>()(
  (set, get) => ({
    subscriptions: [],
    cancelledSubscriptions: [],

    addSubscription: (input) => {
      const now = new Date().toISOString();
      const monthlyPrice = calculateMonthlyPrice(
        input.price,
        input.billingCycle,
      );

      const newSub: Subscription = {
        id: uuidv4(),
        name: input.name,
        category: input.category,
        icon: input.icon,
        billingCycle: input.billingCycle,
        price: input.price,
        monthlyPrice,
        billingDay: input.billingDay,
        status: input.status || 'active',
        isShared: input.isShared || false,
        sharedCount: input.sharedCount,
        trialEndDate: input.trialEndDate,
        memo: input.memo,
        planName: input.planName,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => ({
        subscriptions: [...state.subscriptions, newSub],
      }));

      syncToSupabase('구독 추가', async (userId) => {
        return supabase.from('subscriptions').upsert({
          id: newSub.id, user_id: userId, name: newSub.name, category: newSub.category,
          icon: newSub.icon, billing_cycle: newSub.billingCycle, price: newSub.price,
          monthly_price: newSub.monthlyPrice, billing_day: newSub.billingDay,
          status: newSub.status, is_shared: newSub.isShared, shared_count: newSub.sharedCount,
          trial_end_date: newSub.trialEndDate, memo: newSub.memo, plan_name: newSub.planName,
          created_at: newSub.createdAt, updated_at: newSub.updatedAt,
        });
      });

      return newSub;
    },

    updateSubscription: (id, input) => {
      set((state) => ({
        subscriptions: state.subscriptions.map((sub) => {
          if (sub.id !== id) return sub;

          const updatedPrice =
            input.price !== undefined ? input.price : sub.price;
          const updatedCycle =
            input.billingCycle !== undefined
              ? input.billingCycle
              : sub.billingCycle;
          const monthlyPrice = calculateMonthlyPrice(
            updatedPrice,
            updatedCycle,
          );

          return {
            ...sub,
            ...input,
            price: updatedPrice,
            billingCycle: updatedCycle,
            monthlyPrice,
            updatedAt: new Date().toISOString(),
          };
        }),
      }));

      const updated = get().subscriptions.find((s) => s.id === id);
      if (updated) {
        syncToSupabase('구독 수정', async (_userId) =>
          supabase.from('subscriptions').update({
            name: updated.name, category: updated.category, icon: updated.icon,
            billing_cycle: updated.billingCycle, price: updated.price,
            monthly_price: updated.monthlyPrice, billing_day: updated.billingDay,
            status: updated.status, is_shared: updated.isShared, shared_count: updated.sharedCount,
            trial_end_date: updated.trialEndDate, memo: updated.memo, plan_name: updated.planName,
            updated_at: updated.updatedAt,
          }).eq('id', id),
        );
      }
    },

    deleteSubscription: (id) => {
      set((state) => ({
        subscriptions: state.subscriptions.filter((sub) => sub.id !== id),
      }));

      syncToSupabase('구독 삭제', async (_userId) =>
        supabase.from('subscriptions').delete().eq('id', id),
      );
    },

    cancelSubscription: (id) => {
      const sub = get().subscriptions.find((s) => s.id === id);
      if (!sub) return;

      const now = new Date().toISOString();
      const cancelledSub: Subscription = {
        ...sub,
        status: 'cancelled',
        updatedAt: now,
      };

      set((state) => ({
        subscriptions: state.subscriptions.map((s) =>
          s.id === id ? { ...s, status: 'cancelled' as const, updatedAt: now } : s,
        ),
        cancelledSubscriptions: [
          ...state.cancelledSubscriptions,
          cancelledSub,
        ],
      }));

      syncToSupabase('구독 취소', async (_userId) =>
        supabase.from('subscriptions').update({ status: 'cancelled', updated_at: now }).eq('id', id),
      );
    },

    reactivateSubscription: (id) => {
      const now = new Date().toISOString();
      set((state) => ({
        subscriptions: state.subscriptions.map((s) =>
          s.id === id
            ? { ...s, status: 'active' as const, updatedAt: now }
            : s,
        ),
        cancelledSubscriptions: state.cancelledSubscriptions.filter(
          (s) => s.id !== id,
        ),
      }));

      syncToSupabase('구독 재활성화', async (_userId) =>
        supabase.from('subscriptions').update({ status: 'active', updated_at: now }).eq('id', id),
      );
    },

    reset: () => {
      set({ subscriptions: [], cancelledSubscriptions: [] });
    },

    getSubscription: (id) => {
      return get().subscriptions.find((s) => s.id === id);
    },

    getActiveSubscriptions: () => {
      return get().subscriptions.filter(
        (s) => s.status === 'active' || s.status === 'trial',
      );
    },

    getByCategory: (category) => {
      return get()
        .subscriptions.filter((s) => s.category === category)
        .filter((s) => s.status === 'active' || s.status === 'trial');
    },

    getTotalMonthlyCost: () => {
      return get()
        .subscriptions.filter(
          (s) => s.status === 'active' || s.status === 'trial',
        )
        .reduce((sum, s) => sum + s.monthlyPrice, 0);
    },

    getTotalYearlyCost: () => {
      return get().getTotalMonthlyCost() * 12;
    },

    getSubscriptionCount: () => {
      return get().subscriptions.filter(
        (s) => s.status === 'active' || s.status === 'trial',
      ).length;
    },
  }),
);
