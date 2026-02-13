'use client';

import { useMemo } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { CATEGORY_LABELS, type SubscriptionCategory } from '@/lib/types/subscription';
import type { Subscription } from '@/lib/types/subscription';
import { BrandIcon } from '@/components/subscription/BrandIcon';

// ── Types ──────────────────────────────────────────────────────────────
type EventType = 'added' | 'cancelled' | 'changed';

interface TimelineEvent {
  id: string;
  date: string;          // ISO string
  type: EventType;
  subscription: Subscription;
  /** For "changed" events (price diff); not used for add/cancel */
  priceDiff?: number;
}

interface MonthGroup {
  key: string;           // "2025-01"
  label: string;         // "2025년 1월"
  events: TimelineEvent[];
  monthlyTotal: number;  // running monthly total at that point
}

// ── Helpers ────────────────────────────────────────────────────────────
const EVENT_META: Record<EventType, { symbol: string; label: string; color: string; bg: string }> = {
  added:     { symbol: '+', label: '구독 추가',   color: '#1FC08E', bg: 'rgba(31,192,142,0.10)' },
  cancelled: { symbol: '-', label: '구독 해지',   color: '#F04452', bg: 'rgba(240,68,82,0.10)' },
  changed:   { symbol: '~', label: '가격 변경',   color: '#FFA826', bg: 'rgba(255,168,38,0.10)' },
};

function formatMonth(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── Component ──────────────────────────────────────────────────────────
export function SubscriptionTimeline() {
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const cancelledSubscriptions = useSubscriptionStore((s) => s.cancelledSubscriptions);

  const monthGroups = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Active & cancelled subs → "added" events
    for (const sub of subscriptions) {
      events.push({
        id: `add-${sub.id}`,
        date: sub.createdAt || new Date().toISOString(),
        type: 'added',
        subscription: sub,
      });
    }

    // Cancelled subs → "cancelled" events (use updatedAt as cancel date)
    for (const sub of cancelledSubscriptions) {
      // Avoid duplicating if the sub is also in subscriptions (it stays there with status=cancelled)
      const alreadyAdded = subscriptions.some((s) => s.id === sub.id);
      if (!alreadyAdded) {
        events.push({
          id: `add-cancel-${sub.id}`,
          date: sub.createdAt || new Date().toISOString(),
          type: 'added',
          subscription: sub,
        });
      }
      events.push({
        id: `cancel-${sub.id}`,
        date: sub.updatedAt || new Date().toISOString(),
        type: 'cancelled',
        subscription: sub,
      });
    }

    // Also include subs in main list that are cancelled
    for (const sub of subscriptions) {
      if (sub.status === 'cancelled') {
        const alreadyCancelled = cancelledSubscriptions.some((c) => c.id === sub.id);
        if (!alreadyCancelled) {
          events.push({
            id: `cancel-main-${sub.id}`,
            date: sub.updatedAt || new Date().toISOString(),
            type: 'cancelled',
            subscription: sub,
          });
        }
      }
    }

    // Detect price changes via updatedAt !== createdAt for active subs
    for (const sub of subscriptions) {
      if (
        sub.status === 'active' &&
        sub.updatedAt &&
        sub.createdAt &&
        sub.updatedAt !== sub.createdAt
      ) {
        events.push({
          id: `change-${sub.id}`,
          date: sub.updatedAt,
          type: 'changed',
          subscription: sub,
        });
      }
    }

    // Sort newest first
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Group by month
    const groupMap = new Map<string, TimelineEvent[]>();
    for (const ev of events) {
      const mk = monthKey(ev.date);
      if (!groupMap.has(mk)) groupMap.set(mk, []);
      groupMap.get(mk)!.push(ev);
    }

    // Build sorted month groups
    const sortedKeys = Array.from(groupMap.keys()).sort((a, b) => b.localeCompare(a));

    // Calculate running monthly total at each month point
    // We compute the "active cost" at each month's end by scanning events chronologically
    const activeSubs = subscriptions.filter(
      (s) => s.status === 'active' || s.status === 'trial',
    );
    const currentMonthlyTotal = activeSubs.reduce((sum, s) => sum + s.monthlyPrice, 0);

    const groups: MonthGroup[] = sortedKeys.map((key, idx) => {
      const monthEvents = groupMap.get(key)!;
      // Approximate monthly total: use current total for most recent, adjust for older months
      let monthTotal = currentMonthlyTotal;
      if (idx > 0) {
        // For older months, subtract/add events that happened after that month
        let delta = 0;
        for (let i = 0; i < idx; i++) {
          const laterKey = sortedKeys[i];
          const laterEvents = groupMap.get(laterKey)!;
          for (const ev of laterEvents) {
            if (ev.type === 'added') delta -= ev.subscription.monthlyPrice;
            if (ev.type === 'cancelled') delta += ev.subscription.monthlyPrice;
          }
        }
        monthTotal = Math.max(0, currentMonthlyTotal + delta);
      }

      return {
        key,
        label: formatMonth(monthEvents[0].date),
        events: monthEvents,
        monthlyTotal: monthTotal,
      };
    });

    // Calculate cumulative spending across all months (oldest to newest)
    // Each month's spending = monthlyTotal for that month
    const reversedGroups = [...groups].reverse(); // oldest first
    let cumulativeTotal = 0;
    const cumulativeMap = new Map<string, number>();
    for (const group of reversedGroups) {
      cumulativeTotal += group.monthlyTotal;
      cumulativeMap.set(group.key, Math.round(cumulativeTotal * 100) / 100);
    }
    // Attach cumulative to groups
    for (const group of groups) {
      (group as MonthGroup & { cumulativeSpent: number }).cumulativeSpent =
        cumulativeMap.get(group.key) || 0;
    }

    return groups;
  }, [subscriptions, cancelledSubscriptions]);

  const allEvents = monthGroups.flatMap((g) => g.events);

  if (allEvents.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-extrabold text-foreground mb-1.5">구독 타임라인</h3>
          <p className="text-sm text-muted-foreground font-medium">구독 변화 이력을 시간순으로 확인하세요</p>
        </div>
        <div className="rounded-3xl border-2 border-dashed border-border/60 p-10 text-center">
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            아직 구독 이벤트가 없어요.<br />
            구독을 추가하면 타임라인이 생성됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-extrabold text-foreground mb-1.5">구독 타임라인</h3>
        <p className="text-sm text-muted-foreground font-medium">구독 변화 이력을 시간순으로 확인하세요</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {monthGroups.map((group, groupIdx) => (
          <div key={group.key} className="mb-10 last:mb-0">
            {/* Month header with subtotal + cumulative */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2.5">
                {/* Pulsing month indicator */}
                <div className="relative w-3.5 h-3.5 shrink-0">
                  <div className="absolute inset-0 rounded-full bg-primary opacity-20 animate-ping" />
                  <div className="relative w-3.5 h-3.5 rounded-full bg-primary shadow-[0_0_8px_rgba(49,130,246,0.3)]" />
                </div>
                <h4 className="text-sm font-extrabold text-foreground">{group.label}</h4>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-primary bg-primary/[0.07] px-3 py-1.5 rounded-xl whitespace-nowrap border border-primary/10">
                  월 {formatKRW(group.monthlyTotal)}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2.5 py-1.5 rounded-xl whitespace-nowrap border border-border/40">
                  누적 {formatKRW((group as MonthGroup & { cumulativeSpent: number }).cumulativeSpent || 0)}
                </span>
              </div>
            </div>

            {/* Events with vertical line */}
            <div className="relative ml-[7px] pl-7 space-y-3">
              {/* Gradient timeline line */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, var(--color-border, hsl(var(--border))), transparent)',
                }}
              />

              {group.events.map((event) => {
                const meta = EVENT_META[event.type];
                const sub = event.subscription;
                const eventDate = new Date(event.date);
                const dateStr = `${eventDate.getMonth() + 1}/${eventDate.getDate()}`;

                return (
                  <div
                    key={event.id}
                    className="group relative rounded-2xl border border-border/50 bg-card p-4 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:border-border transition-all duration-300"
                  >
                    {/* Node on the line -- with glow */}
                    <div className="absolute -left-[calc(1.75rem+5px)] top-5">
                      <div
                        className="w-3 h-3 rounded-full border-[2.5px] shadow-sm"
                        style={{
                          backgroundColor: meta.color,
                          borderColor: meta.color,
                          boxShadow: `0 0 8px ${meta.color}30`,
                        }}
                      />
                    </div>

                    {/* Subtle hover glow */}
                    <div
                      className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none"
                      style={{ backgroundColor: meta.color }}
                    />

                    <div className="flex items-center gap-3 relative">
                      {/* Event type badge */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0 border"
                        style={{
                          color: meta.color,
                          backgroundColor: meta.bg,
                          borderColor: `${meta.color}15`,
                        }}
                      >
                        {meta.symbol}
                      </div>

                      {/* Brand icon */}
                      <BrandIcon name={sub.name} icon={sub.icon} size="sm" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground truncate">{sub.name}</span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0"
                            style={{ color: meta.color, backgroundColor: meta.bg }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground font-medium">
                            {CATEGORY_LABELS[sub.category as SubscriptionCategory]}
                          </span>
                          <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30" />
                          <span className="text-[11px] text-muted-foreground/70 font-medium">{dateStr}</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right shrink-0">
                        <div
                          className="text-sm font-extrabold tabular-nums"
                          style={{ color: meta.color }}
                        >
                          {event.type === 'added' && `+${formatKRW(sub.monthlyPrice)}`}
                          {event.type === 'cancelled' && `-${formatKRW(sub.monthlyPrice)}`}
                          {event.type === 'changed' && `${formatKRW(sub.monthlyPrice)}`}
                        </div>
                        <div className="text-[10px] text-muted-foreground/60 font-medium">/월</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Summary -- Premium glass card */}
      <section className="relative overflow-hidden rounded-3xl bg-card border border-border/60 p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)]" aria-label="타임라인 요약">
        {/* Ambient glows */}
        <div className="absolute -top-16 -left-16 w-40 h-40 rounded-full blur-[80px] opacity-[0.05] pointer-events-none" style={{ backgroundColor: '#1FC08E' }} aria-hidden="true" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full blur-[60px] opacity-[0.04] pointer-events-none" style={{ backgroundColor: '#3182F6' }} aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.012] pointer-events-none bg-[radial-gradient(circle_at_60%_40%,var(--color-foreground)_1px,transparent_1px)] bg-[length:20px_20px]" aria-hidden="true" />

        <h4 className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase mb-6 relative">
          타임라인 요약
        </h4>
        <div className="grid gap-5 sm:grid-cols-4 relative">
          <div className="space-y-1.5">
            <div className="text-[11px] text-muted-foreground font-semibold tracking-wide">총 이벤트</div>
            <div className="text-[2rem] font-extrabold text-foreground tracking-tight leading-none">
              {allEvents.length}<span className="text-base font-bold text-muted-foreground ml-0.5">건</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="text-[11px] text-muted-foreground font-semibold tracking-wide">추가</div>
            <div className="text-[2rem] font-extrabold tracking-tight leading-none" style={{ color: '#1FC08E' }}>
              {allEvents.filter((e) => e.type === 'added').length}<span className="text-base font-bold opacity-60 ml-0.5">건</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="text-[11px] text-muted-foreground font-semibold tracking-wide">해지</div>
            <div className="text-[2rem] font-extrabold tracking-tight leading-none" style={{ color: '#F04452' }}>
              {allEvents.filter((e) => e.type === 'cancelled').length}<span className="text-base font-bold opacity-60 ml-0.5">건</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="text-[11px] text-muted-foreground font-semibold tracking-wide">누적 지출</div>
            <div className="text-[2rem] font-extrabold tracking-tight leading-none" style={{ color: '#3182F6' }}>
              {formatKRW(
                monthGroups.length > 0
                  ? (monthGroups[0] as MonthGroup & { cumulativeSpent: number }).cumulativeSpent || 0
                  : 0,
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
