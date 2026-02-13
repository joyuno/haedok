'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CategoryBadge } from './CategoryBadge';
import { BrandIcon } from './BrandIcon';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import type { Subscription } from '@/lib/types/subscription';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { CATEGORY_COLORS } from '@/lib/types/subscription';
import { getServicePreset } from '@/lib/constants/servicePresets';
import { MoreVertical, Edit, Trash2, Calendar, ExternalLink } from 'lucide-react';

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
}

export function SubscriptionCard({
  subscription,
  onEdit,
}: SubscriptionCardProps) {
  const { deleteSubscription } = useSubscriptionStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const preset = getServicePreset(subscription.name);

  const handleDelete = () => {
    deleteSubscription(subscription.id);
    setShowDeleteDialog(false);
  };

  const statusLabels = {
    active: '활성',
    trial: '체험',
    paused: '일시정지',
    cancelled: '해지됨',
  };

  const statusColors = {
    active: 'bg-green-500',
    trial: 'bg-blue-500',
    paused: 'bg-yellow-500',
    cancelled: 'bg-muted-foreground',
  };

  const monthlyDisplay =
    subscription.billingCycle === 'monthly'
      ? formatKRW(subscription.price)
      : `${formatKRW(subscription.price)}/년 (월 ${formatKRW(subscription.monthlyPrice)})`;

  return (
    <>
      <Card className="group hover:shadow-md transition-all duration-200 rounded-2xl border-border">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-4 flex-1">
              <BrandIcon name={subscription.name} icon={subscription.icon} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-xl truncate text-foreground">
                    {subscription.name}
                  </h3>
                  <span
                    className={`h-2 w-2 rounded-full inline-block ${statusColors[subscription.status]}`}
                    title={statusLabels[subscription.status]}
                    role="status"
                    aria-label={`상태: ${statusLabels[subscription.status]}`}
                  />
                </div>
                {subscription.planName && (
                  <p className="text-sm text-muted-foreground mb-3 font-medium">
                    {subscription.planName}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={subscription.category} />
                  <Badge variant="secondary" className="text-xs rounded-lg">
                    <Calendar className="mr-1 h-3 w-3" />
                    매월 {subscription.billingDay}일
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="text-right">
                <div className="font-bold text-2xl text-foreground">
                  {monthlyDisplay}
                </div>
                <div className="text-xs text-muted-foreground font-medium mt-1">
                  {subscription.billingCycle === 'monthly' ? '월간' : '연간'}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg border-border hover:bg-accent hover:border-primary/30 transition-all"
                    aria-label={`${subscription.name} 옵션 메뉴`}
                  >
                    <MoreVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={() => onEdit(subscription)}>
                    <Edit className="mr-2 h-4 w-4" />
                    수정
                  </DropdownMenuItem>
                  {preset?.cancellationUrl && (
                    <DropdownMenuItem
                      onClick={() => window.open(preset.cancellationUrl, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      해지 페이지 이동
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {subscription.memo && (
            <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4 font-medium">
              {subscription.memo}
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              구독을 삭제하시겠습니까?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {subscription.name} 구독을 삭제하면 관련 데이터가 모두 삭제됩니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
