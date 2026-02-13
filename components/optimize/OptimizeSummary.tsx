'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { TrendingDown } from 'lucide-react';

interface OptimizeSummaryProps {
  sharingSavings: number;
  bundleSavings: number;
}

export function OptimizeSummary({
  sharingSavings,
  bundleSavings,
}: OptimizeSummaryProps) {
  const totalMonthlySavings = sharingSavings + bundleSavings;
  const totalYearlySavings = totalMonthlySavings * 12;

  if (totalMonthlySavings === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3" aria-hidden="true">
            <TrendingDown className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              최적화로 절약 가능한 금액
            </h3>
            <div className="flex items-baseline gap-3 mb-3" aria-live="polite">
              <span className="text-3xl font-bold text-primary">
                {formatKRW(totalMonthlySavings)}
              </span>
              <span className="text-sm text-muted-foreground">/ 월</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">연간 절약</span>
                <span className="ml-2 font-semibold text-foreground">
                  {formatKRW(totalYearlySavings)}
                </span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {sharingSavings > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">
                    공유 절약: <span className="font-medium text-foreground">{formatKRW(sharingSavings)}</span>
                  </span>
                </div>
              )}
              {bundleSavings > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">
                    번들 절약: <span className="font-medium text-foreground">{formatKRW(bundleSavings)}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          💡 아래 제안을 활용하면 구독료를 크게 줄일 수 있어요!
        </div>
      </CardContent>
    </Card>
  );
}
