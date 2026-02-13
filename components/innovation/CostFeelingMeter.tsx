'use client';

import { useMemo } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { getCostFeeling, getTotalCostFeeling } from '@/lib/calculations/costFeeling';
import { formatKRW } from '@/lib/utils/formatCurrency';
import type { Subscription } from '@/lib/types/subscription';
import { BrandIcon } from '@/components/subscription/BrandIcon';

interface CostFeelingItemProps {
  subscription: Subscription;
}

function CostFeelingItem({ subscription }: CostFeelingItemProps) {
  const feeling = useMemo(() => getCostFeeling(subscription.monthlyPrice), [subscription.monthlyPrice]);

  // Map feeling level to Toss-style color tokens
  const gaugePercent = Math.min((feeling.dailyCost / 2000) * 100, 100);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:border-border transition-all duration-300">
      {/* Subtle ambient glow based on level color */}
      <div
        className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: feeling.levelColor }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <BrandIcon name={subscription.name} icon={subscription.icon} size="sm" />
            <div>
              <h4 className="font-bold text-sm text-foreground">{subscription.name}</h4>
              <p className="text-xs text-muted-foreground font-medium">{formatKRW(subscription.monthlyPrice)}/월</p>
            </div>
          </div>
          {/* Level badge -- positioned top right */}
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
            style={{
              color: feeling.levelColor,
              backgroundColor: `${feeling.levelColor}12`,
            }}
          >
            {feeling.levelLabel}
          </span>
        </div>

        {/* Daily Cost -- Large prominent number with color accent */}
        <div className="mb-5">
          <p className="text-[11px] text-muted-foreground font-semibold tracking-wide mb-1.5">하루 비용</p>
          <div className="flex items-baseline gap-1">
            <span
              className="text-[1.75rem] font-extrabold tracking-tight leading-none"
              style={{ color: feeling.levelColor }}
            >
              {formatKRW(feeling.dailyCost)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 font-medium leading-relaxed">
            {feeling.comparisonText}
          </p>
        </div>

        {/* Gauge bar -- Segmented with gradient glow */}
        <div className="relative" role="meter" aria-label={`${subscription.name} 비용 수준: ${feeling.levelLabel}`} aria-valuenow={Math.round(gaugePercent)} aria-valuemin={0} aria-valuemax={100}>
          {/* Segments */}
          <div className="flex gap-1 mb-2" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((segment) => {
              const segmentStart = segment * 20;
              const isActive = gaugePercent > segmentStart;
              const segmentFill = Math.min(
                Math.max(((gaugePercent - segmentStart) / 20) * 100, 0),
                100
              );
              const segmentColors = ['#1FC08E', '#8BC34A', '#FFA826', '#FF7043', '#F04452'];

              return (
                <div
                  key={segment}
                  className="h-2 flex-1 rounded-full overflow-hidden transition-all duration-500"
                  style={{
                    backgroundColor: 'var(--color-muted, hsl(var(--muted)))',
                  }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: isActive ? `${Math.max(segmentFill, 100)}%` : '0%',
                      backgroundColor: segmentColors[segment],
                      boxShadow: isActive ? `0 0 8px ${segmentColors[segment]}40` : 'none',
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground/70 font-medium px-0.5">
            <span>저렴</span>
            <span>보통</span>
            <span>비쌈</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CostFeelingMeter() {
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const getActiveSubscriptions = useSubscriptionStore((s) => s.getActiveSubscriptions);
  const getTotalMonthlyCost = useSubscriptionStore((s) => s.getTotalMonthlyCost);

  const activeSubscriptions = useMemo(() => getActiveSubscriptions(), [subscriptions, getActiveSubscriptions]);
  const totalCost = useMemo(() => getTotalMonthlyCost(), [subscriptions, getTotalMonthlyCost]);
  const totalFeeling = useMemo(() => getTotalCostFeeling(totalCost), [totalCost]);

  if (activeSubscriptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-extrabold text-foreground mb-1.5">구독 체감 온도</h3>
        <p className="text-sm text-muted-foreground font-medium">내 구독료, 일상에서 어느 정도일까요?</p>
      </div>

      {/* Individual Subscriptions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activeSubscriptions.map((sub) => (
          <CostFeelingItem key={sub.id} subscription={sub} />
        ))}
      </div>

      {/* Total Summary -- Premium glass card */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/60 p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)]">
        {/* Ambient background accents */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[80px] opacity-[0.06] pointer-events-none bg-primary" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full blur-[60px] opacity-[0.04] pointer-events-none" style={{ backgroundColor: '#1FC08E' }} />
        <div className="absolute inset-0 opacity-[0.012] pointer-events-none bg-[radial-gradient(circle_at_70%_30%,var(--color-foreground)_1px,transparent_1px)] bg-[length:20px_20px]" />

        <h4 className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-6 relative">
          전체 구독료 요약
        </h4>

        <div className="grid gap-6 md:grid-cols-3 relative">
          {/* Daily average */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-muted-foreground font-semibold tracking-wide">하루 평균</div>
            <div className="text-[2rem] font-extrabold text-foreground tracking-tight leading-none">
              {formatKRW(totalFeeling.dailyCost)}
            </div>
          </div>
          {/* Monthly total */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-muted-foreground font-semibold tracking-wide">월 합계</div>
            <div className="text-[2rem] font-extrabold text-primary tracking-tight leading-none">
              {formatKRW(totalCost)}
            </div>
          </div>
          {/* Yearly total */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-muted-foreground font-semibold tracking-wide">연 합계</div>
            <div className="text-[2rem] font-extrabold text-foreground tracking-tight leading-none">
              {formatKRW(totalFeeling.yearlyEquivalent)}
            </div>
          </div>
        </div>

        {/* Comparison insight pill */}
        <div className="mt-6 relative">
          <div className="rounded-2xl bg-primary/[0.05] border border-primary/10 px-5 py-4">
            <p className="text-center text-[13px] font-semibold text-foreground leading-relaxed">
              {totalFeeling.comparisonText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
