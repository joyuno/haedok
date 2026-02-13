'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SubscriptionList, SubscriptionForm } from '@/components/subscription';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import type { Subscription } from '@/lib/types/subscription';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { Plus, PackageOpen } from 'lucide-react';

export default function SubscriptionsPage() {
  const { subscriptions, getTotalMonthlyCost, getSubscriptionCount } =
    useSubscriptionStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setEditingSubscription(null);
    }, 200);
  };

  const totalMonthlyCost = getTotalMonthlyCost();
  const subscriptionCount = getSubscriptionCount();
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'trial',
  );

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">구독 관리</h1>
          <p className="text-muted-foreground text-lg">
            모든 구독을 한 곳에서 관리하세요
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => setDialogOpen(true)}
          className="rounded-xl font-semibold shadow-sm"
        >
          <Plus className="mr-2 h-5 w-5" />
          구독 추가
        </Button>
      </div>

      {subscriptionCount === 0 ? (
        <Card className="border-dashed rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <PackageOpen className="h-20 w-20 text-muted-foreground/30 mb-6" />
            <h3 className="text-2xl font-bold mb-3">
              아직 등록된 구독이 없습니다
            </h3>
            <p className="text-muted-foreground mb-8 text-center text-lg">
              구독 서비스를 추가하고 체계적으로 관리해보세요
            </p>
            <Button
              size="lg"
              onClick={() => setDialogOpen(true)}
              className="rounded-xl font-semibold px-8 py-6 text-base"
            >
              <Plus className="mr-2 h-5 w-5" />
              첫 구독 추가하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <Card className="rounded-2xl border-border">
              <CardContent className="p-7">
                <p className="text-sm text-muted-foreground font-medium mb-2">
                  총 구독 수
                </p>
                <p className="text-3xl sm:text-5xl font-bold">{subscriptionCount}개</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border">
              <CardContent className="p-7">
                <p className="text-sm text-muted-foreground font-medium mb-2">
                  월 총 결제 금액
                </p>
                <p className="text-3xl sm:text-5xl font-bold">
                  {formatKRW(totalMonthlyCost)}
                </p>
              </CardContent>
            </Card>
          </div>

          <SubscriptionList
            subscriptions={activeSubscriptions}
            onEdit={handleEdit}
          />
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingSubscription ? '구독 수정' : '구독 추가'}
            </DialogTitle>
          </DialogHeader>
          <SubscriptionForm
            mode={editingSubscription ? 'edit' : 'add'}
            subscription={editingSubscription || undefined}
            onSuccess={handleDialogClose}
            onCancel={handleDialogClose}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
