'use client';

import { Calendar, CreditCard } from 'lucide-react';
import type { Subscription } from '@/lib/types';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { CATEGORY_COLORS } from '@/lib/types';

interface PaymentCalendarProps {
  subscriptions: Subscription[];
}

export function PaymentCalendar({ subscriptions }: PaymentCalendarProps) {
  // Get current month and filter active subscriptions
  const today = new Date();
  const currentDay = today.getDate();

  // Sort by billing day
  const upcomingPayments = subscriptions
    .filter((sub) => sub.status === 'active' || sub.status === 'trial')
    .sort((a, b) => a.billingDay - b.billingDay);

  if (upcomingPayments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-2 text-muted-foreground/30" />
        <p className="font-medium">예정된 결제가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {upcomingPayments.slice(0, 5).map((sub) => {
        const isToday = sub.billingDay === currentDay;
        const isPast = sub.billingDay < currentDay;

        return (
          <div
            key={sub.id}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
              isToday
                ? 'bg-accent border-primary/30 shadow-sm'
                : 'bg-card border-border hover:border-border/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                style={{ backgroundColor: CATEGORY_COLORS[sub.category] }}
              >
                {sub.icon || sub.name.slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-foreground">{sub.name}</p>
                <p className="text-sm text-muted-foreground font-medium">
                  매월 {sub.billingDay}일
                  {isToday && (
                    <span className="ml-2 text-primary font-semibold">
                      오늘 결제
                    </span>
                  )}
                  {isPast && !isToday && (
                    <span className="ml-2 text-muted-foreground/60">
                      결제 완료
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-foreground">
                {formatKRW(sub.monthlyPrice)}
              </p>
              {sub.billingCycle === 'yearly' && (
                <p className="text-xs text-muted-foreground font-medium">
                  연간 구독
                </p>
              )}
            </div>
          </div>
        );
      })}
      {upcomingPayments.length > 5 && (
        <p className="text-center text-sm text-muted-foreground pt-2 font-medium">
          외 {upcomingPayments.length - 5}개 구독
        </p>
      )}
    </div>
  );
}
