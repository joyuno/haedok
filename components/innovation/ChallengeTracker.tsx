'use client';

import { useMemo } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { BrandIcon } from '@/components/subscription/BrandIcon';
import { TossEmoji } from '@/components/ui/TossEmoji';

interface Badge {
  id: string;
  name: string;
  emoji: string;
  threshold: number;
  color: string;
}

const BADGES: Badge[] = [
  { id: 'bronze', name: '브론즈', emoji: '🥉', threshold: 10000, color: '#cd7f32' },
  { id: 'silver', name: '실버', emoji: '🥈', threshold: 30000, color: '#c0c0c0' },
  { id: 'gold', name: '골드', emoji: '🥇', threshold: 50000, color: '#ffd700' },
  { id: 'diamond', name: '다이아', emoji: '💎', threshold: 100000, color: '#b9f2ff' },
];

export function ChallengeTracker() {
  const cancelledSubscriptions = useSubscriptionStore((s) => s.cancelledSubscriptions);

  const totalSavings = useMemo(() => {
    return cancelledSubscriptions.reduce((sum, sub) => sum + sub.monthlyPrice, 0);
  }, [cancelledSubscriptions]);

  const currentBadge = useMemo(() => {
    for (let i = BADGES.length - 1; i >= 0; i--) {
      if (totalSavings >= BADGES[i].threshold) {
        return BADGES[i];
      }
    }
    return null;
  }, [totalSavings]);

  const nextBadge = useMemo(() => {
    for (const badge of BADGES) {
      if (totalSavings < badge.threshold) {
        return badge;
      }
    }
    return null;
  }, [totalSavings]);

  const progress = useMemo(() => {
    if (!nextBadge) return 100;
    const previousThreshold = currentBadge?.threshold || 0;
    const range = nextBadge.threshold - previousThreshold;
    const current = totalSavings - previousThreshold;
    return Math.min((current / range) * 100, 100);
  }, [totalSavings, currentBadge, nextBadge]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-foreground mb-1">구독 다이어트 챌린지</h3>
        <p className="text-sm text-muted-foreground font-medium">구독을 줄이고 배지를 모아보세요!</p>
      </div>

      {/* Current Status -- Toss-style hero card */}
      <div className="rounded-2xl bg-card border border-border p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="text-center mb-6">
          <div className="mb-2 flex justify-center">
            <TossEmoji emoji={currentBadge?.emoji || '🎯'} size={56} />
          </div>
          <h4 className="text-lg font-extrabold text-foreground mb-1">
            {currentBadge ? `${currentBadge.name} 달성!` : '시작하세요!'}
          </h4>
          <div className="text-4xl font-extrabold text-primary tracking-tight">{formatKRW(totalSavings)}</div>
          <div className="text-xs text-muted-foreground font-semibold mt-1">월 절약액</div>
        </div>

        {/* Progress to Next Badge */}
        {nextBadge && (
          <div className="bg-accent/50 rounded-xl p-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="font-bold text-foreground">다음 배지까지</span>
              <span className="font-bold text-primary">
                {formatKRW(nextBadge.threshold - totalSavings)} 남음
              </span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #3182F6, #5B9CF6)',
                }}
              />
            </div>
            <div className="text-[11px] text-center text-muted-foreground font-semibold">
              {nextBadge.emoji} {nextBadge.name} ({formatKRW(nextBadge.threshold)})
            </div>
          </div>
        )}

        {!nextBadge && (
          <div className="text-center text-sm text-primary font-bold bg-primary/[0.05] rounded-xl p-3">
            모든 배지를 획득했습니다! 최고예요!
          </div>
        )}
      </div>

      {/* All Badges -- Grid layout */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-bold text-foreground mb-4">배지 목록</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {BADGES.map((badge) => {
            const earned = totalSavings >= badge.threshold;
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  earned
                    ? 'bg-primary/[0.04] border-primary/20 shadow-sm'
                    : 'bg-muted/30 border-border opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={earned ? '' : 'grayscale opacity-50'}>
                    <TossEmoji emoji={badge.emoji} size={36} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-foreground">{badge.name}</div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {formatKRW(badge.threshold)} 절약
                    </div>
                  </div>
                  {earned && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancelled Subscriptions List */}
      {cancelledSubscriptions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h4 className="text-sm font-bold text-foreground mb-4">
            절약한 구독 ({cancelledSubscriptions.length}개)
          </h4>
          <div className="space-y-2">
            {cancelledSubscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-accent/40">
                <div className="flex items-center gap-2.5">
                  <BrandIcon name={sub.name} icon={sub.icon} size="sm" />
                  <span className="text-sm font-semibold text-foreground/70">{sub.name}</span>
                </div>
                <span className="text-sm font-bold text-[#1FC08E]">
                  +{formatKRW(sub.monthlyPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cancelledSubscriptions.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <TossEmoji emoji="✂️" size={28} />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            아직 절약한 구독이 없어요.<br />
            사용하지 않는 구독을 해지해보세요!
          </p>
        </div>
      )}
    </div>
  );
}
