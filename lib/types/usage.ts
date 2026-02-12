export type ROIGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type RecommendAction = 'keep' | 'review' | 'downgrade' | 'share' | 'cancel';
export type BenchmarkLevel = 'heavy' | 'average' | 'below' | 'minimal';

export interface WeeklyUsage {
  id: string;
  subscriptionId: string;
  weekStartDate: string;
  usageMinutes: number;
  inputMethod: 'manual' | 'csv' | 'feeling';
  createdAt: string;
}

export interface ROIAnalysis {
  subscriptionId: string;
  subscriptionName: string;
  icon: string;
  monthlyPrice: number;
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
  { label: string; color: string; bgColor: string; emoji: string; badgeClass: string; blockClass: string; textClass: string }
> = {
  A: {
    label: '훌륭한 가성비',
    color: '#22c55e',
    bgColor: '#f0fdf4',
    emoji: '🟢',
    badgeClass: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
    blockClass: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
    textClass: 'text-green-600 dark:text-green-400',
  },
  B: {
    label: '괜찮음',
    color: '#eab308',
    bgColor: '#fefce8',
    emoji: '🟡',
    badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
    blockClass: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800',
    textClass: 'text-yellow-600 dark:text-yellow-400',
  },
  C: {
    label: '비효율적',
    color: '#f97316',
    bgColor: '#fff7ed',
    emoji: '🟠',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700',
    blockClass: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800',
    textClass: 'text-orange-600 dark:text-orange-400',
  },
  D: {
    label: '해지 추천',
    color: '#ef4444',
    bgColor: '#fef2f2',
    emoji: '🔴',
    badgeClass: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700',
    blockClass: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
    textClass: 'text-red-600 dark:text-red-400',
  },
  F: {
    label: '미사용',
    color: '#1f2937',
    bgColor: '#f3f4f6',
    emoji: '⚫',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700',
    blockClass: 'bg-gray-50 border-gray-200 dark:bg-gray-950/30 dark:border-gray-800',
    textClass: 'text-gray-600 dark:text-gray-400',
  },
};
