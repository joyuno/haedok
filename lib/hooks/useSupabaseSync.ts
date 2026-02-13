'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useUsageStore } from '@/stores/usageStore';
import { clearCachedUserId, setCachedUserId } from '@/lib/auth/ensureUserId';
import type { Subscription, SubscriptionCategory, BillingCycle, SubscriptionStatus, UsageMetricType } from '@/lib/types/subscription';
import type { WeeklyUsage } from '@/lib/types/usage';

/**
 * Supabase를 단일 데이터 소스로 사용하는 동기화 훅.
 * - 로그인 시: Supabase에서 데이터를 로드하여 Zustand 스토어에 설정
 * - 로그아웃 시: Zustand 스토어를 초기화 (빈 상태)
 * - localStorage는 사용하지 않음
 */
export function useSupabaseSync() {
  const { user } = useAuth();
  const synced = useRef(false);
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    // 로그아웃 감지: 이전에 user가 있었는데 지금 null이면 스토어 초기화
    if (!user) {
      if (prevUserId.current) {
        clearCachedUserId();
        useSubscriptionStore.getState().reset();
        useUsageStore.getState().reset();
        console.log('[Sync] 로그아웃 감지 → 스토어 + 캐시 초기화');
      }
      prevUserId.current = null;
      synced.current = false;
      return;
    }

    // 같은 유저면 중복 sync 방지
    if (synced.current && prevUserId.current === user.id) return;
    synced.current = true;
    prevUserId.current = user.id;
    setCachedUserId(user.id);

    // Supabase에서 데이터 로드
    (async () => {
      // 1) 구독 데이터 로드
      const { data: subs, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (subsError) {
        console.error('[Sync] 구독 로드 실패:', subsError.message);
      } else if (subs && subs.length > 0) {
        const mapped: Subscription[] = subs.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category as SubscriptionCategory,
          icon: s.icon,
          billingCycle: s.billing_cycle as BillingCycle,
          price: Number(s.price),
          monthlyPrice: Number(s.monthly_price),
          billingDay: s.billing_day,
          status: s.status as SubscriptionStatus,
          isShared: s.is_shared,
          sharedCount: s.shared_count,
          trialEndDate: s.trial_end_date,
          memo: s.memo,
          planName: s.plan_name,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }));
        const cancelled = mapped.filter(s => s.status === 'cancelled');
        useSubscriptionStore.setState({ subscriptions: mapped, cancelledSubscriptions: cancelled });
        console.log(`[Sync] Supabase → 구독 ${mapped.length}건 로드`);
      } else {
        // Supabase가 비어있으면 빈 상태 유지
        useSubscriptionStore.setState({ subscriptions: [], cancelledSubscriptions: [] });
      }

      // 2) 이용률 데이터 로드
      const { data: usage, error: usageError } = await supabase
        .from('usage_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (usageError) {
        console.error('[Sync] 이용률 로드 실패:', usageError.message);
      } else if (usage && usage.length > 0) {
        const mapped: WeeklyUsage[] = usage.map((u) => ({
          id: u.id,
          subscriptionId: u.subscription_id,
          weekStartDate: u.week_start_date,
          usageMinutes: Number(u.usage_minutes),
          metricType: u.metric_type as UsageMetricType | undefined,
          inputMethod: u.input_method as 'manual' | 'csv' | 'feeling',
          createdAt: u.created_at,
        }));
        useUsageStore.setState({ usageRecords: mapped });
        console.log(`[Sync] Supabase → 이용률 ${mapped.length}건 로드`);
      } else {
        useUsageStore.setState({ usageRecords: [] });
      }
    })();
  }, [user]);
}

/**
 * Save a subscription to Supabase (upsert)
 */
export async function saveSubscriptionToSupabase(userId: string, sub: Subscription) {
  await supabase.from('subscriptions').upsert({
    id: sub.id,
    user_id: userId,
    name: sub.name,
    category: sub.category,
    icon: sub.icon,
    billing_cycle: sub.billingCycle,
    price: sub.price,
    monthly_price: sub.monthlyPrice,
    billing_day: sub.billingDay,
    status: sub.status,
    is_shared: sub.isShared,
    shared_count: sub.sharedCount,
    trial_end_date: sub.trialEndDate,
    memo: sub.memo,
    plan_name: sub.planName,
    created_at: sub.createdAt,
    updated_at: sub.updatedAt,
  });
}

/**
 * Delete a subscription from Supabase
 */
export async function deleteSubscriptionFromSupabase(subId: string) {
  await supabase.from('subscriptions').delete().eq('id', subId);
}

/**
 * Save a usage record to Supabase
 */
export async function saveUsageToSupabase(userId: string, record: WeeklyUsage) {
  await supabase.from('usage_records').upsert({
    id: record.id,
    user_id: userId,
    subscription_id: record.subscriptionId,
    week_start_date: record.weekStartDate,
    usage_minutes: record.usageMinutes,
    metric_type: record.metricType,
    input_method: record.inputMethod,
    created_at: record.createdAt,
  });
}

/**
 * Delete a usage record from Supabase
 */
export async function deleteUsageFromSupabase(recordId: string) {
  await supabase.from('usage_records').delete().eq('id', recordId);
}
