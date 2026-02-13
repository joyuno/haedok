'use client';

import { Calendar } from 'lucide-react';
import type { Subscription } from '@/lib/types';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { BrandIcon } from '@/components/subscription/BrandIcon';

interface PaymentCalendarProps {
  subscriptions: Subscription[];
}

export function PaymentCalendar({ subscriptions }: PaymentCalendarProps) {
  // Next month's payment schedule
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonthNumber = nextMonth.getMonth() + 1;
  const nextMonthDays = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();

  // All active subscriptions are "upcoming" for next month
  const activePayments = subscriptions
    .filter((sub) => sub.status === 'active' || sub.status === 'trial')
    .map((sub) => ({
      ...sub,
      // Clamp billing day to next month's max days (e.g. 31 → 28 for Feb)
      billingDay: Math.min(sub.billingDay, nextMonthDays),
    }))
    .sort((a, b) => a.billingDay - b.billingDay);

  // For "다음 달", everything is upcoming
  const upcoming = activePayments;
  const past: typeof activePayments = [];
  const upcomingPayments = activePayments;

  if (upcomingPayments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
          <Calendar className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="font-semibold text-sm">예정된 결제가 없습니다</p>
        <p className="text-xs mt-1 text-muted-foreground/60">구독을 추가하면 일정이 표시됩니다</p>
      </div>
    );
  }

  // Calculate days until each next-month billing day
  const getDaysUntil = (billingDay: number) => {
    const target = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), billingDay);
    const diffMs = target.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const renderItem = (sub: Subscription & { billingDay: number }) => {
    const daysUntil = getDaysUntil(sub.billingDay);
    const isFirstDay = sub.billingDay === 1;

    return (
      <li
        key={sub.id}
        className={`flex items-center gap-3.5 p-3.5 rounded-2xl transition-all duration-200 list-none ${
          isFirstDay
            ? 'bg-primary/[0.06] ring-1 ring-primary/20'
            : 'hover:bg-accent/50'
        }`}
      >
        {/* Date column */}
        <div className={`flex flex-col items-center justify-center w-11 h-11 rounded-xl shrink-0 ${
          isFirstDay
            ? 'bg-primary text-primary-foreground'
            : 'bg-accent text-foreground'
        }`}>
          <span className="text-[10px] font-semibold leading-none opacity-70">
            {nextMonthNumber}월
          </span>
          <span className="text-base font-extrabold leading-tight">
            {sub.billingDay}
          </span>
        </div>

        {/* Brand icon + name */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <BrandIcon name={sub.name} icon={sub.icon || sub.name.slice(0, 2)} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground truncate">{sub.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {sub.billingCycle === 'yearly' && (
                <span className="text-[10px] font-semibold text-primary/60 bg-primary/[0.06] px-1.5 py-0.5 rounded-md">
                  연간
                </span>
              )}
              <span className="text-[10px] text-muted-foreground font-medium">
                {daysUntil <= 0 ? '곧 결제' : `${daysUntil}일 후`}
              </span>
            </div>
          </div>
        </div>

        {/* Price */}
        <p className={`text-base font-bold shrink-0 tabular-nums ${
          isFirstDay ? 'text-primary' : 'text-foreground'
        }`}>
          {formatKRW(sub.monthlyPrice)}
        </p>
      </li>
    );
  };

  const maxDisplay = 6;
  const displayItems = upcoming.slice(0, maxDisplay);
  const totalAll = activePayments.length;

  return (
    <div className="space-y-1" role="list" aria-label="다음 달 결제 일정">
      <p className="text-[11px] font-bold text-primary px-1 pb-1">
        {nextMonthNumber}월 결제 예정 ({totalAll})
      </p>
      <ul className="space-y-1">
        {displayItems.map(renderItem)}
      </ul>

      {/* Overflow indicator */}
      {totalAll > maxDisplay && (
        <p className="text-center text-xs text-muted-foreground font-semibold bg-accent/50 rounded-xl py-2 mt-2">
          외 {totalAll - maxDisplay}개 구독
        </p>
      )}
    </div>
  );
}
