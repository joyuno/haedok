export type SubscriptionCategory =
  | 'video'
  | 'music'
  | 'cloud'
  | 'productivity'
  | 'shopping'
  | 'gaming'
  | 'reading'
  | 'other';

export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'trial' | 'paused' | 'cancelled';

export interface Subscription {
  id: string;
  name: string;
  category: SubscriptionCategory;
  icon: string;
  billingCycle: BillingCycle;
  price: number;
  monthlyPrice: number;
  billingDay: number;
  status: SubscriptionStatus;
  isShared: boolean;
  sharedCount?: number;
  trialEndDate?: string;
  memo?: string;
  planName?: string;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  video: 'OTT',
  music: '음악',
  cloud: '클라우드',
  productivity: '생산성',
  shopping: '쇼핑/배달',
  gaming: '게임',
  reading: '독서',
  other: '기타',
};

export const CATEGORY_COLORS: Record<SubscriptionCategory, string> = {
  video: '#ef4444',
  music: '#8b5cf6',
  cloud: '#3b82f6',
  productivity: '#f59e0b',
  shopping: '#10b981',
  gaming: '#ec4899',
  reading: '#6366f1',
  other: '#6b7280',
};

/**
 * 카테고리별 사용량 측정 방식
 * - time: 주간 이용 시간 (영상, 음악, 게임)
 * - count: 월간 이용 횟수 (쇼핑, 배달)
 * - frequency: 주 사용 일수 (클라우드, 생산성, 독서, 기타)
 */
export type UsageMetricType = 'time' | 'count' | 'frequency';

export const CATEGORY_METRIC: Record<SubscriptionCategory, UsageMetricType> = {
  video: 'time',
  music: 'time',
  cloud: 'frequency',
  productivity: 'frequency',
  shopping: 'count',
  gaming: 'time',
  reading: 'frequency',
  other: 'frequency',
};

export const METRIC_LABELS: Record<UsageMetricType, { unit: string; inputLabel: string; inputPlaceholder: string; perLabel: string }> = {
  time: { unit: '시간', inputLabel: '주간 사용 시간', inputPlaceholder: '0', perLabel: '시간당' },
  count: { unit: '회', inputLabel: '월간 이용 횟수', inputPlaceholder: '0', perLabel: '회당' },
  frequency: { unit: '일', inputLabel: '주 사용 일수', inputPlaceholder: '0', perLabel: '일당' },
};
