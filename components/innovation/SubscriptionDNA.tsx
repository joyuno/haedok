'use client';

import { useMemo } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { analyzeDNA } from '@/lib/calculations/subscriptionDNA';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { CATEGORY_LABELS, CATEGORY_COLORS, type SubscriptionCategory } from '@/lib/types/subscription';
import { Button } from '@/components/ui/button';
import { TossEmoji } from '@/components/ui/TossEmoji';
import { Share2 } from 'lucide-react';

export function SubscriptionDNA() {
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const getActiveSubscriptions = useSubscriptionStore((s) => s.getActiveSubscriptions);
  const getTotalMonthlyCost = useSubscriptionStore((s) => s.getTotalMonthlyCost);

  const dnaProfile = useMemo(() => analyzeDNA(subscriptions), [subscriptions]);
  const activeSubscriptions = useMemo(() => getActiveSubscriptions(), [subscriptions]);
  const totalCost = useMemo(() => getTotalMonthlyCost(), [subscriptions]);

  // Calculate category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<SubscriptionCategory, { count: number; spend: number }> = {
      video: { count: 0, spend: 0 },
      music: { count: 0, spend: 0 },
      cloud: { count: 0, spend: 0 },
      productivity: { count: 0, spend: 0 },
      shopping: { count: 0, spend: 0 },
      gaming: { count: 0, spend: 0 },
      reading: { count: 0, spend: 0 },
      other: { count: 0, spend: 0 },
    };

    for (const sub of activeSubscriptions) {
      breakdown[sub.category].count++;
      breakdown[sub.category].spend += sub.monthlyPrice;
    }

    return Object.entries(breakdown)
      .filter(([_, data]) => data.spend > 0)
      .map(([category, data]) => ({
        category: category as SubscriptionCategory,
        label: CATEGORY_LABELS[category as SubscriptionCategory],
        color: CATEGORY_COLORS[category as SubscriptionCategory],
        spend: data.spend,
        percentage: totalCost > 0 ? (data.spend / totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.spend - a.spend);
  }, [activeSubscriptions, totalCost]);

  const handleShare = () => {
    const text = `나의 구독 DNA는 [${dnaProfile.emoji} ${dnaProfile.name}] 타입!\n월 ${formatKRW(totalCost)}를 구독에 사용 중 🔍 SubScout에서 확인`;
    navigator.clipboard.writeText(text);
    alert('클립보드에 복사되었습니다!');
  };

  if (activeSubscriptions.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* Subtle background accent */}
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-[0.04] blur-3xl pointer-events-none"
        style={{ backgroundColor: categoryBreakdown[0]?.color || '#3182F6' }}
      />

      {/* DNA Type Result */}
      <div className="text-center mb-8 relative">
        <div className="mb-3 flex justify-center">
          <TossEmoji emoji={dnaProfile.emoji} size={72} />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-1.5">{dnaProfile.name}</h2>
        <p className="text-sm text-muted-foreground font-medium mb-4 max-w-sm mx-auto">{dnaProfile.description}</p>
        <div className="inline-flex items-center gap-2 bg-primary/[0.06] rounded-full px-5 py-2 text-sm font-bold text-primary">
          <span>월 {formatKRW(totalCost)}</span>
          <span className="w-1 h-1 rounded-full bg-primary/30" />
          <span>구독 {activeSubscriptions.length}개</span>
        </div>
      </div>

      {/* Characteristics */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-muted-foreground tracking-wide uppercase mb-3">특징</h3>
        <div className="space-y-2">
          {dnaProfile.characteristics.map((char, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">{char}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown -- Toss-style bar chart */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-muted-foreground tracking-wide uppercase mb-3">카테고리별 지출</h3>
        <div className="space-y-3">
          {categoryBreakdown.map((item) => (
            <div key={item.category}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold text-foreground">{item.label}</span>
                <span className="font-bold text-foreground tabular-nums">
                  {formatKRW(item.spend)}
                  <span className="text-muted-foreground font-medium ml-1 text-xs">
                    {item.percentage.toFixed(0)}%
                  </span>
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="bg-primary/[0.04] rounded-xl p-4 mb-6 border border-primary/10">
        <h3 className="text-xs font-bold text-primary mb-1.5">절약 팁</h3>
        <p className="text-sm text-foreground font-medium">{dnaProfile.tip}</p>
      </div>

      {/* Share Button */}
      <Button onClick={handleShare} className="w-full rounded-xl" variant="outline" size="lg">
        <Share2 className="mr-2 h-4 w-4" />
        공유하기
      </Button>
    </div>
  );
}
