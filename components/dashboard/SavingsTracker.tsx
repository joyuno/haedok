'use client';

import { TrendingDown, Sparkles } from 'lucide-react';
import { formatKRW } from '@/lib/utils/formatCurrency';

interface SavingsTrackerProps {
  totalSavings: number;
  monthlySavings: number;
}

export function SavingsTracker({
  totalSavings,
  monthlySavings,
}: SavingsTrackerProps) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-7 border border-green-200/50 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="bg-green-600 rounded-full p-2">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-bold text-foreground text-lg">누적 절약액</h3>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-2">
            총 절약 금액
          </p>
          <p className="text-5xl font-bold text-green-600">
            {formatKRW(totalSavings)}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-5 border-t border-green-200">
          <TrendingDown className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm text-muted-foreground font-medium">
              월 절감액
            </p>
            <p className="text-2xl font-bold text-green-700">
              {formatKRW(monthlySavings)}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-2 font-medium">
          구독 취소 및 최적화를 통해 절약한 금액입니다
        </p>
      </div>
    </div>
  );
}
