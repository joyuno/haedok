'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatKRW } from '@/lib/utils/formatCurrency';
import {
  DISCOUNT_EVENTS,
  findMatchingEvents,
  groupEventsByType,
  EVENT_TYPE_LABELS,
  type DiscountEvent,
} from '@/lib/constants/discountEvents';
import type { Subscription } from '@/lib/types/subscription';
import { ExternalLink, Sparkles, Tag, Clock, CreditCard, Smartphone, Gift, PackageOpen } from 'lucide-react';

interface DiscountEventsProps {
  subscriptions: Subscription[];
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  card: <CreditCard className="h-4 w-4" />,
  telecom: <Smartphone className="h-4 w-4" />,
  promotion: <Gift className="h-4 w-4" />,
  bundle_deal: <PackageOpen className="h-4 w-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  card: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
  telecom: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800',
  promotion: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  bundle_deal: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
};

function DiscountBadge({ event }: { event: DiscountEvent }) {
  if (event.discountAmount) {
    return (
      <span className="text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
        {formatKRW(event.discountAmount)} 할인
      </span>
    );
  }
  if (event.discountPercent) {
    return (
      <span className="text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
        {event.discountPercent}% 할인
      </span>
    );
  }
  return null;
}

function EventCard({ event, isMatched }: { event: DiscountEvent; isMatched?: boolean }) {
  return (
    <Card
      className={`overflow-hidden rounded-2xl transition-all hover:shadow-md ${
        isMatched
          ? 'border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
          : ''
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0 mt-0.5">{event.icon}</div>
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-base">{event.title}</h4>
              {isMatched && (
                <Badge className="bg-green-500 hover:bg-green-600 text-white text-[10px] px-1.5 py-0">
                  <Sparkles className="w-3 h-3 mr-0.5" />
                  내 구독 적용 가능
                </Badge>
              )}
            </div>

            {/* Provider */}
            <p className="text-xs text-muted-foreground mt-0.5">{event.provider}</p>

            {/* Description */}
            <p className="text-sm text-foreground mt-2 leading-relaxed">{event.description}</p>

            {/* Discount amount */}
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <DiscountBadge event={event} />
              <Badge variant="outline" className={TYPE_COLORS[event.type]}>
                {TYPE_ICONS[event.type]}
                <span className="ml-1">{EVENT_TYPE_LABELS[event.type]}</span>
              </Badge>
            </div>

            {/* Target services */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {event.targetServices.map((service) => (
                <Badge key={service} variant="secondary" className="text-xs font-normal">
                  {service}
                </Badge>
              ))}
            </div>

            {/* Conditions */}
            {event.conditions && (
              <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">
                <span className="font-medium">조건:</span> {event.conditions}
              </p>
            )}

            {/* Valid until */}
            {event.validUntil && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                <Clock className="w-3 h-3" />
                <span>{event.validUntil}</span>
              </div>
            )}

            {/* CTA button */}
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-1.5 mt-3 w-full rounded-xl text-sm font-bold py-2.5 transition-colors ${
                  isMatched
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-primary/[0.08] hover:bg-primary/[0.15] text-primary'
                }`}
              >
                {isMatched ? '할인 적용하러 가기' : '혜택 확인하기'} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DiscountEvents({ subscriptions }: DiscountEventsProps) {
  const serviceNames = useMemo(
    () => subscriptions.map((s) => s.name),
    [subscriptions],
  );

  const matchedEvents = useMemo(
    () => findMatchingEvents(serviceNames),
    [serviceNames],
  );

  const matchedIds = useMemo(
    () => new Set(matchedEvents.map((e) => e.id)),
    [matchedEvents],
  );

  const unmatchedEvents = useMemo(
    () => DISCOUNT_EVENTS.filter((e) => !matchedIds.has(e.id)),
    [matchedIds],
  );

  const groupedUnmatched = useMemo(
    () => groupEventsByType(unmatchedEvents),
    [unmatchedEvents],
  );

  const typeOrder: string[] = ['card', 'telecom', 'promotion', 'bundle_deal'];

  return (
    <div className="space-y-8">
      {/* Matched events for user's subscriptions */}
      {matchedEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-bold">내 구독에 적용 가능한 할인</h3>
            <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
              {matchedEvents.length}건
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            현재 구독 중인 서비스에 적용할 수 있는 할인 혜택이에요
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {matchedEvents.map((event) => (
              <EventCard key={event.id} event={event} isMatched />
            ))}
          </div>
        </div>
      )}

      {/* All events grouped by type */}
      {typeOrder.map((type) => {
        const events = groupedUnmatched[type];
        if (!events || events.length === 0) return null;

        return (
          <div key={type} className="space-y-4">
            <div className="flex items-center gap-2">
              {TYPE_ICONS[type]}
              <h3 className="text-lg font-bold">{EVENT_TYPE_LABELS[type]}</h3>
              <Badge variant="secondary" className="text-xs">
                {events.length}개
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty state when no subscriptions */}
      {subscriptions.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="py-16 text-center">
            <Tag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              구독을 추가하면 맞춤 할인 정보를 보여드려요
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              위의 전체 할인 이벤트 목록을 둘러보세요
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
