import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { WeeklyUsage, ROIAnalysis } from '@/lib/types/usage';
import type { Subscription, UsageMetricType } from '@/lib/types/subscription';
import { CATEGORY_METRIC } from '@/lib/types/subscription';
import { calculateROIAnalysis } from '@/lib/calculations/roi';
import { SERVICE_PRESETS } from '@/lib/constants/servicePresets';
import type { ParsedUsageEntry } from '@/lib/utils/csvParser';
import { supabase } from '@/lib/supabase';

async function syncToSupabase(action: string, fn: () => Promise<{ error: any }>) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { error } = await fn();
    if (error) {
      console.error(`[Supabase] ${action} 실패:`, error.message);
    }
  } catch (e) {
    console.error(`[Supabase] ${action} 에러:`, e);
  }
}

interface UsageState {
  usageRecords: WeeklyUsage[];

  // CRUD
  addUsage: (
    subscriptionId: string,
    weekStartDate: string,
    usageMinutes: number,
    inputMethod: 'manual' | 'csv' | 'feeling',
    metricType?: UsageMetricType,
  ) => WeeklyUsage;
  updateUsage: (id: string, usageMinutes: number) => void;
  deleteUsage: (id: string) => void;

  // Import
  importFromCSV: (
    entries: ParsedUsageEntry[],
    subscriptionMap: Record<string, string>,
  ) => number;

  // Reset (로그아웃 시 호출)
  reset: () => void;

  // Getters
  getUsageBySubscription: (subscriptionId: string) => WeeklyUsage[];
  getLatestUsage: (subscriptionId: string) => WeeklyUsage | undefined;
  getAverageWeeklyUsage: (subscriptionId: string) => number;

  // Analysis
  generateROIAnalysis: (subscriptions: Subscription[]) => ROIAnalysis[];
}

export const useUsageStore = create<UsageState>()(
  (set, get) => ({
    usageRecords: [],

    addUsage: (subscriptionId, weekStartDate, usageMinutes, inputMethod, metricType) => {
      const record: WeeklyUsage = {
        id: uuidv4(),
        subscriptionId,
        weekStartDate,
        usageMinutes,
        inputMethod,
        metricType,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        usageRecords: [...state.usageRecords, record],
      }));

      syncToSupabase('사용량 추가', async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return supabase.from('usage_records').upsert({
          id: record.id, user_id: session!.user.id, subscription_id: record.subscriptionId,
          week_start_date: record.weekStartDate, usage_minutes: record.usageMinutes,
          metric_type: record.metricType, input_method: record.inputMethod,
          created_at: record.createdAt,
        });
      });

      return record;
    },

    updateUsage: (id, usageMinutes) => {
      set((state) => ({
        usageRecords: state.usageRecords.map((r) =>
          r.id === id ? { ...r, usageMinutes } : r,
        ),
      }));

      syncToSupabase('사용량 수정', async () =>
        supabase.from('usage_records').update({
          usage_minutes: usageMinutes, updated_at: new Date().toISOString(),
        }).eq('id', id),
      );
    },

    deleteUsage: (id) => {
      set((state) => ({
        usageRecords: state.usageRecords.filter((r) => r.id !== id),
      }));

      syncToSupabase('사용량 삭제', async () =>
        supabase.from('usage_records').delete().eq('id', id),
      );
    },

    importFromCSV: (entries, subscriptionMap) => {
      let imported = 0;
      const newRecords: WeeklyUsage[] = [];

      for (const entry of entries) {
        const subscriptionId = subscriptionMap[entry.appName];
        if (!subscriptionId) continue;

        newRecords.push({
          id: uuidv4(),
          subscriptionId,
          weekStartDate: entry.date || new Date().toISOString().split('T')[0],
          usageMinutes: entry.usageMinutes,
          inputMethod: 'csv',
          createdAt: new Date().toISOString(),
        });
        imported++;
      }

      if (newRecords.length > 0) {
        set((state) => ({
          usageRecords: [...state.usageRecords, ...newRecords],
        }));

        // Bulk sync to Supabase
        (async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;
            const rows = newRecords.map((r) => ({
              id: r.id, user_id: session.user.id, subscription_id: r.subscriptionId,
              week_start_date: r.weekStartDate, usage_minutes: r.usageMinutes,
              input_method: r.inputMethod, created_at: r.createdAt,
            }));
            const { error } = await supabase.from('usage_records').upsert(rows);
            if (error) {
              console.error('[Supabase] CSV 임포트 실패:', error.message);
            }
          } catch (e) {
            console.error('[Supabase] CSV 임포트 에러:', e);
          }
        })();
      }

      return imported;
    },

    reset: () => {
      set({ usageRecords: [] });
    },

    getUsageBySubscription: (subscriptionId) => {
      return get()
        .usageRecords.filter((r) => r.subscriptionId === subscriptionId)
        .sort(
          (a, b) =>
            new Date(b.weekStartDate).getTime() -
            new Date(a.weekStartDate).getTime(),
        );
    },

    getLatestUsage: (subscriptionId) => {
      const records = get().getUsageBySubscription(subscriptionId);
      return records.length > 0 ? records[0] : undefined;
    },

    getAverageWeeklyUsage: (subscriptionId) => {
      const records = get().getUsageBySubscription(subscriptionId);
      if (records.length === 0) return 0;

      const total = records.reduce((sum, r) => sum + r.usageMinutes, 0);
      return Math.round(total / records.length);
    },

    generateROIAnalysis: (subscriptions) => {
      const active = subscriptions.filter(
        (s) => s.status === 'active' || s.status === 'trial',
      );

      return active.map((sub) => {
        const latestUsage = get().getLatestUsage(sub.id);
        const weeklyUsage = get().getAverageWeeklyUsage(sub.id);
        const preset = SERVICE_PRESETS[sub.name];
        const sharingAvailable = !!preset?.familyPlan && !sub.isShared;
        const metricType = latestUsage?.metricType || CATEGORY_METRIC[sub.category];

        return calculateROIAnalysis(sub, weeklyUsage, sharingAvailable, metricType);
      });
    },
  }),
);
