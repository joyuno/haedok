import type { UsageMetricType } from './subscription';

export type ROIGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type RecommendAction = 'keep' | 'review' | 'downgrade' | 'share' | 'cancel';
export type BenchmarkLevel = 'heavy' | 'average' | 'below' | 'minimal';

export interface WeeklyUsage {
  id: string;
  subscriptionId: string;
  weekStartDate: string;
  /** 시간 기반: 분 단위 | 횟수 기반: 월간 횟수 | 빈도 기반: 주 사용 일수 */
  usageMinutes: number;
  /** 측정 방식 (legacy 데이터는 undefined → 'time' 취급) */
  metricType?: UsageMetricType;
  inputMethod: 'manual' | 'csv' | 'feeling';
  createdAt: string;
}

export interface ROIAnalysis {
  subscriptionId: string;
  subscriptionName: string;
  icon: string;
  category: string;
  monthlyPrice: number;
  /** 측정 방식 */
  metricType: UsageMetricType;
  /** 원시 사용량 값 (시간: 주간 분, 횟수: 월간 횟수, 빈도: 주 일수) */
  usageValue: number;
  /** 표시용 사용량 라벨 ("12.5시간/주", "8회/월", "5일/주") */
  usageLabel: string;
  /** 비용 효율성 (시간당/회당/일당 비용) */
  costEfficiency: number;
  /** 표시용 비용 라벨 ("₩1,200/시간", "₩623/회") */
  costEfficiencyLabel: string;
  // Legacy fields (kept for backward compat)
  weeklyUsageMinutes: number;
  monthlyUsageMinutes: number;
  costPerMinute: number;
  grade: ROIGrade;
  recommendation: RecommendAction;
  recommendationReason: string;
  potentialSavings: number;
}

export interface BenchmarkResult {
  level: BenchmarkLevel;
  percentOfAverage: number;
  averageMinutes: number;
  userMinutes: number;
  feedback: string;
  isVerified: boolean;
}

export const ROI_GRADE_CONFIG: Record<
  ROIGrade,
  { label: string; color: string; bgColor: string; badgeClass: string; blockClass: string; textClass: string }
> = {
  A: {
    label: '훌륭한 가성비',
    color: '#22c55e',
    bgColor: '#f0fdf4',
    badgeClass: 'bg-green-50 dark:bg-green-950/40',
    blockClass: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
    textClass: 'text-green-600 dark:text-green-400',
  },
  B: {
    label: '괜찮음',
    color: '#eab308',
    bgColor: '#fefce8',
    badgeClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    blockClass: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800',
    textClass: 'text-yellow-600 dark:text-yellow-400',
  },
  C: {
    label: '비효율적',
    color: '#f97316',
    bgColor: '#fff7ed',
    badgeClass: 'bg-orange-50 dark:bg-orange-950/40',
    blockClass: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800',
    textClass: 'text-orange-600 dark:text-orange-400',
  },
  D: {
    label: '해지 추천',
    color: '#ef4444',
    bgColor: '#fef2f2',
    badgeClass: 'bg-red-50 dark:bg-red-950/40',
    blockClass: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
    textClass: 'text-red-600 dark:text-red-400',
  },
  F: {
    label: '미사용',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    badgeClass: 'bg-gray-50 dark:bg-gray-950/40',
    blockClass: 'bg-gray-50 border-gray-200 dark:bg-gray-950/30 dark:border-gray-800',
    textClass: 'text-gray-600 dark:text-gray-400',
  },
};
