'use client';

import { useMemo } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { getDNARadarData } from '@/lib/calculations/subscriptionDNA';
import { formatKRW } from '@/lib/utils/formatCurrency';

const DONUT_COLORS = ['#3182F6', '#1FC08E', '#FFA826', '#F04452', '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280'];

export function DNARadarChart() {
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);

  const radarData = useMemo(() => getDNARadarData(subscriptions), [subscriptions]);

  const filteredData = useMemo(() => radarData.filter((d) => d.spend > 0), [radarData]);

  const totalSpend = useMemo(() => filteredData.reduce((sum, d) => sum + d.spend, 0), [filteredData]);

  const metrics = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        averageCost: 0,
        topCategory: { name: '-', amount: 0 },
        diversity: 0,
        concentration: 0,
      };
    }

    // Average subscription cost (total spend / number of subscriptions)
    const averageCost = Math.round(totalSpend / subscriptions.length);

    // Most expensive category
    const topCategory = filteredData.reduce((max, item) =>
      item.spend > max.amount ? { name: item.category, amount: item.spend } : max,
      { name: filteredData[0].category, amount: filteredData[0].spend }
    );

    // Subscription diversity (number of unique categories)
    const diversity = filteredData.length;

    // Category concentration (percentage of top category)
    const concentration = totalSpend > 0 ? Math.round((topCategory.amount / totalSpend) * 100) : 0;

    return { averageCost, topCategory, diversity, concentration };
  }, [filteredData, totalSpend, subscriptions.length]);

  if (filteredData.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-sm font-bold text-foreground mb-4">구독 분포</h3>

      {/* Horizontal Stacked Bar */}
      <div className="h-8 w-full rounded-lg overflow-hidden flex" role="img" aria-label={`구독 분포: ${filteredData.map((d) => `${d.category} ${((d.spend / totalSpend) * 100).toFixed(0)}%`).join(', ')}`}>
        {filteredData.map((item, index) => {
          const percentage = (item.spend / totalSpend) * 100;
          return (
            <div
              key={item.category}
              className="relative group transition-all hover:opacity-80"
              style={{
                width: `${percentage}%`,
                backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length],
              }}
              title={`${item.category}: ${formatKRW(item.spend)} (${percentage.toFixed(1)}%)`}
            >
              {percentage > 12 && (
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold" style={{ color: '#fff' }}>
                  {percentage.toFixed(0)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend + Metrics in one horizontal row */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {filteredData.map((item, index) => (
            <div key={item.category} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
              />
              <span className="font-medium text-foreground">{item.category}</span>
              <span className="text-muted-foreground tabular-nums">{formatKRW(item.spend)}</span>
            </div>
          ))}
        </div>

        {/* Key Metrics - horizontal */}
        <div className="flex gap-6 text-xs">
          <div>
            <span className="text-muted-foreground">평균</span>
            <span className="ml-1.5 font-bold text-foreground tabular-nums">{formatKRW(metrics.averageCost)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">다양성</span>
            <span className="ml-1.5 font-bold text-foreground">{metrics.diversity}개</span>
          </div>
          <div>
            <span className="text-muted-foreground">집중도</span>
            <span className="ml-1.5 font-bold text-foreground tabular-nums">{metrics.concentration}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
