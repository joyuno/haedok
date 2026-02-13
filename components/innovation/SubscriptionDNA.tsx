'use client';

import { useMemo, useState } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { analyzeDNA } from '@/lib/calculations/subscriptionDNA';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { CATEGORY_LABELS, CATEGORY_COLORS, type SubscriptionCategory } from '@/lib/types/subscription';
import { Button } from '@/components/ui/button';
import { TossEmoji } from '@/components/ui/TossEmoji';
import { DNAShareCard } from './DNAShareCard';
import { Share2, Image } from 'lucide-react';

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

  const [showShareCard, setShowShareCard] = useState(false);

  const handleShare = () => {
    const text = `나의 구독 DNA는 [${dnaProfile.emoji} ${dnaProfile.name}] 타입!\n월 ${formatKRW(totalCost)}를 구독에 사용 중 🔍 해독에서 확인`;
    navigator.clipboard.writeText(text);
    alert('클립보드에 복사되었습니다!');
  };

  const handleShareCard = () => {
    setShowShareCard(true);
  };

  if (activeSubscriptions.length === 0) {
    return null;
  }

  const dominantColor = categoryBreakdown[0]?.color || '#3182F6';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)] h-full">
      {/* Ambient glow layers */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[100px] opacity-[0.08] pointer-events-none"
        style={{ backgroundColor: dominantColor }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full blur-[80px] opacity-[0.05] pointer-events-none"
        style={{ backgroundColor: categoryBreakdown[1]?.color || '#1FC08E' }}
        aria-hidden="true"
      />
      {/* Subtle noise texture via gradient */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[radial-gradient(circle_at_20%_50%,var(--color-foreground)_1px,transparent_1px)] bg-[length:24px_24px]" aria-hidden="true" />

      {/* Hero section with gradient backdrop */}
      <div className="relative px-8 pt-10 pb-8">
        <div
          className="absolute inset-x-0 top-0 h-48 opacity-[0.04] pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${dominantColor}, transparent 70%)`,
          }}
          aria-hidden="true"
        />

        {/* DNA Emoji with ambient ring */}
        <div className="relative text-center mb-6">
          <div className="relative inline-flex items-center justify-center">
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-20 scale-150"
              style={{ backgroundColor: dominantColor }}
            />
            {/* Glass ring */}
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-card/80 backdrop-blur-sm border border-border/40 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <TossEmoji emoji={dnaProfile.emoji} size={56} />
            </div>
          </div>
        </div>

        {/* DNA Type Title */}
        <div className="text-center">
          <h2 className="text-[1.75rem] font-extrabold text-foreground tracking-tight mb-2">
            {dnaProfile.name}
          </h2>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto mb-5">
            {dnaProfile.description}
          </p>

          {/* Stats pill with glass effect */}
          <div className="inline-flex items-center gap-3 bg-primary/[0.06] backdrop-blur-sm rounded-2xl px-6 py-2.5 border border-primary/10">
            <span className="text-sm font-bold text-primary">
              월 {formatKRW(totalCost)}
            </span>
            <div className="w-1 h-1 rounded-full bg-primary/30" />
            <span className="text-sm font-bold text-primary">
              구독 {activeSubscriptions.length}개
            </span>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="px-8 pb-8">
        {/* Characteristics -- refined chips */}
        <div className="mb-8">
          <h3 className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-3.5">
            특징
          </h3>
          <div className="space-y-2.5">
            {dnaProfile.characteristics.map((char, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div
                  className="mt-1.5 w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_rgba(0,0,0,0.1)]"
                  style={{ backgroundColor: dominantColor }}
                />
                <span className="text-[13px] font-medium text-foreground leading-relaxed">{char}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown -- premium bar chart */}
        <div className="mb-8">
          <h3 className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-4">
            카테고리별 지출
          </h3>
          <div className="space-y-4">
            {categoryBreakdown.map((item, idx) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-[4px] shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[13px] font-semibold text-foreground">{item.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[13px] font-bold text-foreground tabular-nums">
                      {formatKRW(item.spend)}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                {/* Bar track */}
                <div
                  className="h-2.5 bg-muted/60 rounded-full overflow-hidden"
                  role="meter"
                  aria-label={`${item.label} 지출 비율`}
                  aria-valuenow={Math.round(item.percentage)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                    style={{
                      width: `${Math.max(item.percentage, 2)}%`,
                      backgroundColor: item.color,
                    }}
                  >
                    {/* Shine effect on bar */}
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 50%, transparent)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tip card -- glass morphism */}
        <div
          className="relative overflow-hidden rounded-2xl p-5 mb-7 border"
          style={{
            backgroundColor: `${dominantColor}08`,
            borderColor: `${dominantColor}18`,
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none"
            style={{ backgroundColor: dominantColor }}
          />
          <h3
            className="text-xs font-bold mb-1.5"
            style={{ color: dominantColor }}
          >
            절약 팁
          </h3>
          <p className="text-[13px] text-foreground font-medium leading-relaxed relative">
            {dnaProfile.tip}
          </p>
        </div>

        {/* Share buttons -- refined with subtle gradient */}
        <div className="flex gap-3">
          <Button
            onClick={handleShare}
            className="flex-1 rounded-2xl h-12 text-[13px] font-bold border-border/60 hover:bg-accent/80 transition-all duration-200"
            variant="outline"
            size="lg"
          >
            <Share2 className="mr-2 h-4 w-4 opacity-70" aria-hidden="true" />
            텍스트 복사
          </Button>
          <Button
            onClick={handleShareCard}
            className="flex-1 rounded-2xl h-12 text-[13px] font-bold shadow-[0_2px_12px_rgba(49,130,246,0.25)] hover:shadow-[0_4px_20px_rgba(49,130,246,0.35)] transition-all duration-200"
            size="lg"
          >
            <Image className="mr-2 h-4 w-4" aria-hidden="true" />
            카드 이미지 생성
          </Button>
        </div>
      </div>

      {/* Share Card Modal */}
      {showShareCard && (
        <DNAShareCard
          dnaProfile={dnaProfile}
          totalCost={totalCost}
          subscriptionCount={activeSubscriptions.length}
          categoryBreakdown={categoryBreakdown}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  );
}
