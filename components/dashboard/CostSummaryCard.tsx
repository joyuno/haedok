'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatKRW } from '@/lib/utils/formatCurrency';

interface CostSummaryCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  /** When true, format amount as currency (default). When false, display raw number with suffix. */
  isCurrency?: boolean;
  /** Suffix to append to the amount when isCurrency is false (e.g., "개") */
  suffix?: string;
}

export function CostSummaryCard({
  title,
  amount,
  subtitle,
  change,
  icon,
  isCurrency = true,
  suffix,
}: CostSummaryCardProps) {
  return (
    <article className="group relative bg-card rounded-2xl border border-border p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-primary/20 hover:-translate-y-0.5 overflow-hidden" aria-label={`${title}: ${isCurrency ? formatKRW(amount) : `${amount.toLocaleString('ko-KR')}${suffix || ''}`}`}>
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" aria-hidden="true" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-[13px] font-semibold text-muted-foreground tracking-wide">
            {title}
          </h3>
          {icon && (
            <div className="text-primary/60 bg-primary/[0.08] rounded-xl p-2 group-hover:bg-primary/[0.12] transition-colors duration-200" aria-hidden="true">
              {icon}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-[32px] leading-tight font-extrabold text-foreground tracking-tight">
            {isCurrency
              ? formatKRW(amount)
              : `${amount.toLocaleString('ko-KR')}${suffix || ''}`}
          </p>

          {subtitle && (
            <p className="text-[13px] text-muted-foreground font-medium">
              {subtitle}
            </p>
          )}

          {change && (
            <div className="flex items-center gap-1.5 text-sm pt-2">
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  change.isPositive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {change.isPositive ? (
                  <TrendingUp className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <TrendingDown className="w-3 h-3" aria-hidden="true" />
                )}
                <span>
                  {change.isPositive ? '+' : ''}
                  {formatKRW(change.value)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                지난달 대비
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
