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
    <section className="bg-card rounded-2xl p-7 border border-border shadow-[0_2px_12px_rgba(0,0,0,0.04)]" aria-label="누적 절약액">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="bg-[#1FC08E] rounded-xl p-2" aria-hidden="true">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <h3 className="font-bold text-foreground text-base">누적 절약액</h3>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-xs text-muted-foreground font-semibold mb-1.5">
            총 절약 금액
          </p>
          <p className="text-4xl font-extrabold text-[#1FC08E] tracking-tight" aria-live="polite">
            {formatKRW(totalSavings)}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-5 border-t border-border">
          <div className="w-8 h-8 rounded-lg bg-[#1FC08E]/10 flex items-center justify-center" aria-hidden="true">
            <TrendingDown className="w-4 h-4 text-[#1FC08E]" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold">
              월 절감액
            </p>
            <p className="text-xl font-extrabold text-foreground tracking-tight">
              {formatKRW(monthlySavings)}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-2 font-medium">
          구독 취소 및 최적화를 통해 절약한 금액입니다
        </p>
      </div>
    </section>
  );
}
