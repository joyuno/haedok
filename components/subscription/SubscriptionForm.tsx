'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ServicePresets } from './ServicePresets';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import {
  type SubscriptionCategory,
  type BillingCycle,
  type SubscriptionStatus,
  CATEGORY_LABELS,
  type Subscription,
} from '@/lib/types/subscription';
import type { ServicePreset } from '@/lib/constants/servicePresets';
import { formatKRW } from '@/lib/utils/formatCurrency';

interface SubscriptionFormProps {
  mode: 'add' | 'edit';
  subscription?: Subscription;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SubscriptionForm({
  mode,
  subscription,
  onSuccess,
  onCancel,
}: SubscriptionFormProps) {
  const { addSubscription, updateSubscription } = useSubscriptionStore();

  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<ServicePreset | null>(
    null,
  );

  // Form state
  const [name, setName] = useState(subscription?.name || '');
  const [category, setCategory] = useState<SubscriptionCategory>(
    subscription?.category || 'other',
  );
  const [icon, setIcon] = useState(subscription?.icon || '📌');
  const [planName, setPlanName] = useState(subscription?.planName || '');
  const [price, setPrice] = useState(subscription?.price.toString() || '');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    subscription?.billingCycle || 'monthly',
  );
  const [billingDay, setBillingDay] = useState(
    subscription?.billingDay.toString() || '1',
  );
  const [status, setStatus] = useState<SubscriptionStatus>(
    subscription?.status || 'active',
  );
  const [memo, setMemo] = useState(subscription?.memo || '');

  useEffect(() => {
    if (mode === 'edit' && subscription) {
      setActiveTab('custom');
    }
  }, [mode, subscription]);

  const handlePresetSelect = (preset: ServicePreset) => {
    setSelectedPreset(preset);
    setName(preset.name);
    setCategory(preset.category);
    setIcon(preset.icon);
    setActiveTab('custom');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = parseInt(price, 10);
    const billingDayNum = parseInt(billingDay, 10);

    if (!name || !priceNum || !billingDayNum) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (mode === 'add') {
      addSubscription({
        name,
        category,
        icon,
        billingCycle,
        price: priceNum,
        billingDay: billingDayNum,
        status,
        memo: memo || undefined,
        planName: planName || undefined,
      });
    } else if (subscription) {
      updateSubscription(subscription.id, {
        name,
        category,
        icon,
        billingCycle,
        price: priceNum,
        billingDay: billingDayNum,
        status,
        memo: memo || undefined,
        planName: planName || undefined,
      });
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === 'add' && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset">인기 서비스 선택</TabsTrigger>
            <TabsTrigger value="custom">직접 입력</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="mt-4">
            <ServicePresets onSelect={handlePresetSelect} />
          </TabsContent>
        </Tabs>
      )}

      {activeTab === 'custom' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">서비스 이름 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="넷플릭스"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">아이콘</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🎬"
                maxLength={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as SubscriptionCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planName">요금제명</Label>
              <Input
                id="planName"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="프리미엄"
              />
            </div>
          </div>

          {selectedPreset && selectedPreset.plans.length > 0 && (
            <div className="space-y-2">
              <Label>요금제 선택</Label>
              <div className="grid gap-2">
                {selectedPreset.plans.map((plan) => (
                  <Button
                    key={plan.name}
                    type="button"
                    variant="outline"
                    className="justify-between"
                    onClick={() => {
                      setPlanName(plan.name);
                      setPrice(plan.price.toString());
                      setBillingCycle(plan.cycle);
                    }}
                  >
                    <span>{plan.name}</span>
                    <span className="text-muted-foreground">
                      {formatKRW(plan.price)} /{' '}
                      {plan.cycle === 'monthly' ? '월' : '년'}
                    </span>
                  </Button>
                ))}
                {selectedPreset.familyPlan && (
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-between border-primary"
                    onClick={() => {
                      setPlanName(selectedPreset.familyPlan!.name);
                      setPrice(selectedPreset.familyPlan!.price.toString());
                      setBillingCycle(selectedPreset.familyPlan!.cycle);
                    }}
                  >
                    <span>
                      {selectedPreset.familyPlan.name} (
                      {selectedPreset.familyPlan.maxMembers}인 공유)
                    </span>
                    <span className="text-muted-foreground">
                      {formatKRW(selectedPreset.familyPlan.price)} /{' '}
                      {selectedPreset.familyPlan.cycle === 'monthly'
                        ? '월'
                        : '년'}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">가격 (원) *</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="13500"
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingCycle">결제 주기 *</Label>
              <Select
                value={billingCycle}
                onValueChange={(v) => setBillingCycle(v as BillingCycle)}
              >
                <SelectTrigger id="billingCycle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">월간</SelectItem>
                  <SelectItem value="yearly">연간</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billingDay">결제일 *</Label>
              <Input
                id="billingDay"
                type="number"
                value={billingDay}
                onChange={(e) => setBillingDay(e.target.value)}
                placeholder="1"
                required
                min="1"
                max="31"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">상태</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as SubscriptionStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="trial">체험</SelectItem>
                  <SelectItem value="paused">일시정지</SelectItem>
                  <SelectItem value="cancelled">해지됨</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">메모</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="가족 공유 중, 프로모션 할인 등..."
              rows={2}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">
          {mode === 'add' ? '구독 추가' : '수정 완료'}
        </Button>
      </div>
    </form>
  );
}
