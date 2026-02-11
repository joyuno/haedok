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
          <h3 className="text-2xl font-extrabold text-foreground mb-1">구독 타임라인</h3>
          <p className="text-sm text-muted-foreground font-medium">구독 변화 이력을 시간순으로 확인하세요</p>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            아직 구독 이벤트가 없어요.<br />
            구독을 추가하면 타임라인이 생성됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-foreground mb-1">구독 타임라인</h3>
        <p className="text-sm text-muted-foreground font-medium">구독 변화 이력을 시간순으로 확인하세요</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {monthGroups.map((group, groupIdx) => (
          <div key={group.key} className="mb-8 last:mb-0">
            {/* Month header with subtotal + cumulative */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                <h4 className="text-sm font-extrabold text-foreground">{group.label}</h4>
              </div>
              <div className="flex-1 h-px bg-border" />
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-primary bg-primary/[0.06] px-3 py-1 rounded-full whitespace-nowrap">
                  월 {formatKRW(group.monthlyTotal)}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground bg-accent px-2 py-1 rounded-full whitespace-nowrap">
                  누적 {formatKRW((group as MonthGroup & { cumulativeSpent: number }).cumulativeSpent || 0)}
                </span>
              </div>
            </div>

            {/* Events with vertical line */}
            <div className="relative ml-1.5 pl-6 border-l-2 border-border space-y-3">
              {group.events.map((event) => {
                const meta = EVENT_META[event.type];
                const sub = event.subscription;
                const eventDate = new Date(event.date);
                const dateStr = `${eventDate.getMonth() + 1}/${eventDate.getDate()}`;

                return (
                  <div
                    key={event.id}
                    className="relative rounded-2xl border border-border bg-card p-4 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-border/80 transition-all duration-300"
                  >
                    {/* Node on the line */}
                    <div
                      className="absolute -left-[calc(1.5rem+5px)] top-5 w-3 h-3 rounded-full border-2 shrink-0"
                      style={{
                        backgroundColor: meta.color,
                        borderColor: meta.color,
                      }}
                    />

                    <div className="flex items-center gap-3">
                      {/* Event type badge */}
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold shrink-0"
                        style={{ color: meta.color, backgroundColor: meta.bg }}
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
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                            style={{ color: meta.color, backgroundColor: meta.bg }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground font-medium">
                            {CATEGORY_LABELS[sub.category as SubscriptionCategory]}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{dateStr}</span>
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
                        <div className="text-[10px] text-muted-foreground font-medium">/월</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-2xl bg-card border border-border p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <h4 className="text-xs font-bold text-muted-foreground tracking-wide uppercase mb-4">타임라인 요약</h4>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground font-semibold mb-1">총 이벤트</div>
            <div className="text-3xl font-extrabold text-foreground tracking-tight">
              {allEvents.length}건
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-semibold mb-1">추가</div>
            <div className="text-3xl font-extrabold tracking-tight" style={{ color: '#1FC08E' }}>
              {allEvents.filter((e) => e.type === 'added').length}건
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-semibold mb-1">해지</div>
            <div className="text-3xl font-extrabold tracking-tight" style={{ color: '#F04452' }}>
              {allEvents.filter((e) => e.type === 'cancelled').length}건
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-semibold mb-1">누적 지출</div>
            <div className="text-3xl font-extrabold tracking-tight" style={{ color: '#3182F6' }}>
              {formatKRW(
                monthGroups.length > 0
                  ? (monthGroups[0] as MonthGroup & { cumulativeSpent: number }).cumulativeSpent || 0
                  : 0,
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
