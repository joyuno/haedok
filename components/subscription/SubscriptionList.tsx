'use client';

import { useState } from 'react';
import { SubscriptionCard } from './SubscriptionCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Subscription, SubscriptionCategory } from '@/lib/types/subscription';
import { CATEGORY_LABELS } from '@/lib/types/subscription';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { Card, CardContent } from '@/components/ui/card';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
}

type SortOption = 'name' | 'price' | 'category' | 'billingDay';

export function SubscriptionList({
  subscriptions,
  onEdit,
}: SubscriptionListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterCategory, setFilterCategory] = useState<
    SubscriptionCategory | 'all'
  >('all');

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (filterCategory === 'all') return true;
    return sub.category === filterCategory;
  });

  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name, 'ko-KR');
      case 'price':
        return b.monthlyPrice - a.monthlyPrice;
      case 'category':
        return a.category.localeCompare(b.category);
      case 'billingDay':
        return a.billingDay - b.billingDay;
      default:
        return 0;
    }
  });

  const totalMonthly = subscriptions
    .filter((s) => s.status === 'active' || s.status === 'trial')
    .reduce((sum, s) => sum + s.monthlyPrice, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="sort" className="mb-2 block">
            정렬
          </Label>
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger id="sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">이름순</SelectItem>
              <SelectItem value="price">가격순</SelectItem>
              <SelectItem value="category">카테고리순</SelectItem>
              <SelectItem value="billingDay">결제일순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="filter" className="mb-2 block">
            카테고리 필터
          </Label>
          <Select
            value={filterCategory}
            onValueChange={(v) =>
              setFilterCategory(v as SubscriptionCategory | 'all')
            }
          >
            <SelectTrigger id="filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {sortedSubscriptions.map((subscription) => (
          <SubscriptionCard
            key={subscription.id}
            subscription={subscription}
            onEdit={onEdit}
          />
        ))}
      </div>

      {sortedSubscriptions.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          표시할 구독이 없습니다.
        </div>
      )}

      {sortedSubscriptions.length > 0 && (
        <Card className="border-t-4 border-t-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">월 총 결제 금액</p>
                <p className="text-3xl font-bold mt-1">{formatKRW(totalMonthly)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">활성 구독</p>
                <p className="text-2xl font-semibold mt-1">
                  {subscriptions.filter((s) => s.status === 'active' || s.status === 'trial').length}개
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
