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
}

export function CostSummaryCard({
  title,
  amount,
  subtitle,
  change,
  icon,
}: CostSummaryCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between mb-5">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon && (
          <div className="text-muted-foreground bg-accent rounded-full p-2">
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-4xl font-bold text-foreground tracking-tight">
          {formatKRW(amount)}
        </p>

        {subtitle && (
          <p className="text-sm text-muted-foreground font-medium">
            {subtitle}
          </p>
        )}

        {change && (
          <div className="flex items-center gap-1.5 text-sm mt-3">
            {change.isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
            <span
              className={
                change.isPositive
                  ? 'text-green-600 font-semibold'
                  : 'text-destructive font-semibold'
              }
            >
              {change.isPositive ? '+' : ''}
              {formatKRW(change.value)}
            </span>
            <span className="text-muted-foreground">지난달 대비</span>
          </div>
        )}
      </div>
    </div>
  );
}
