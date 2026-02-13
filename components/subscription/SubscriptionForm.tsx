'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Slider } from '@/components/ui/slider';
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
import { getUSDtoKRW, convertUSDtoKRW, formatExchangeInfo } from '@/lib/utils/exchangeRate';
import { Users, User } from 'lucide-react';

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

  // Family plan sharing state
  const [isFamilyPlan, setIsFamilyPlan] = useState(false);
  const [sharingMode, setSharingMode] = useState<'solo' | 'split'>('solo');
  const [memberCount, setMemberCount] = useState(2);
  const [maxMembers, setMaxMembers] = useState(4);
  const [familyPlanFullPrice, setFamilyPlanFullPrice] = useState(0);

  // Exchange rate state
  const [exchangeRate, setExchangeRate] = useState<number>(1450);
  const [selectedCurrency, setSelectedCurrency] = useState<'KRW' | 'USD'>('KRW');
  const [usdPrice, setUsdPrice] = useState<number>(0);

  // Fetch exchange rate on mount
  useEffect(() => {
    getUSDtoKRW().then((rate) => {
      setExchangeRate(rate);
    });
  }, []);

  const splitPrice = useMemo(() => {
    if (!isFamilyPlan || sharingMode !== 'split' || memberCount <= 0) return 0;
    return Math.ceil(familyPlanFullPrice / memberCount);
  }, [isFamilyPlan, sharingMode, memberCount, familyPlanFullPrice]);

  useEffect(() => {
    if (mode === 'edit' && subscription) {
      setActiveTab('custom');
      if (subscription.isShared && subscription.sharedCount) {
        setIsFamilyPlan(true);
        setSharingMode('split');
        setMemberCount(subscription.sharedCount);
      }
    }
  }, [mode, subscription]);

  const handlePresetSelect = (preset: ServicePreset) => {
    setSelectedPreset(preset);
    setName(preset.name);
    setCategory(preset.category);
    setIcon(preset.icon);
    setIsFamilyPlan(false);
    setSharingMode('solo');
    setSelectedCurrency('KRW');
    setUsdPrice(0);
    setActiveTab('custom');
  };

  const handleFamilyPlanSelect = (preset: ServicePreset) => {
    if (!preset.familyPlan) return;
    const fp = preset.familyPlan;
    const fpCurrency = fp.currency || 'KRW';
    setPlanName(fp.name);
    setBillingCycle(fp.cycle);
    setMaxMembers(fp.maxMembers);
    setMemberCount(fp.maxMembers);
    setIsFamilyPlan(true);
    setSharingMode('solo');
    setSelectedCurrency(fpCurrency);

    if (fpCurrency === 'USD') {
      const krwConverted = Math.round(convertUSDtoKRW(fp.price, exchangeRate));
      setUsdPrice(fp.price);
      setFamilyPlanFullPrice(krwConverted);
      setPrice(krwConverted.toString());
    } else {
      setUsdPrice(0);
      setFamilyPlanFullPrice(fp.price);
      setPrice(fp.price.toString());
    }
  };

  /** Format price display for a plan button */
  const formatPlanPrice = (planPrice: number, currency: 'KRW' | 'USD' | undefined, cycle: BillingCycle) => {
    const cycleLabel = cycle === 'monthly' ? '월' : '년';
    if (currency === 'USD') {
      const krwConverted = Math.round(convertUSDtoKRW(planPrice, exchangeRate));
      return `$${planPrice.toFixed(2)} (${formatKRW(krwConverted)}) / ${cycleLabel}`;
    }
    return `${formatKRW(planPrice)} / ${cycleLabel}`;
  };

  useEffect(() => {
    if (isFamilyPlan && sharingMode === 'split') {
      setPrice(splitPrice.toString());
    } else if (isFamilyPlan && sharingMode === 'solo') {
      setPrice(familyPlanFullPrice.toString());
    }
  }, [isFamilyPlan, sharingMode, splitPrice, familyPlanFullPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = parseInt(price, 10);
    const billingDayNum = parseInt(billingDay, 10);

    if (!name || !priceNum || !billingDayNum) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    const isShared = isFamilyPlan && sharingMode === 'split';
    const sharedCount = isShared ? memberCount : undefined;

    if (mode === 'add') {
      addSubscription({
        name,
        category,
        icon,
        billingCycle,
        price: priceNum,
        billingDay: billingDayNum,
        status,
        isShared,
        sharedCount,
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
        isShared,
        sharedCount,
        memo: memo || undefined,
        planName: planName || undefined,
      });
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label={mode === 'add' ? '구독 추가 폼' : '구독 수정 폼'}>
      {mode === 'add' && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preset' | 'custom')}>
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
          <div className="space-y-2">
            <Label htmlFor="name">서비스 이름 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!selectedPreset && e.target.value) {
                  setIcon(e.target.value.charAt(0).toUpperCase());
                }
              }}
              placeholder="넷플릭스"
              required
            />
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
                {selectedPreset.plans.map((plan) => {
                  const planCurrency = plan.currency || 'KRW';
                  return (
                    <Button
                      key={plan.name}
                      type="button"
                      variant="outline"
                      className="justify-between"
                      onClick={() => {
                        setPlanName(plan.name);
                        setBillingCycle(plan.cycle);
                        setIsFamilyPlan(false);
                        setSelectedCurrency(planCurrency);

                        if (planCurrency === 'USD') {
                          const krwConverted = Math.round(convertUSDtoKRW(plan.price, exchangeRate));
                          setUsdPrice(plan.price);
                          setPrice(krwConverted.toString());
                        } else {
                          setUsdPrice(0);
                          setPrice(plan.price.toString());
                        }
                      }}
                    >
                      <span>{plan.name}</span>
                      <span className="text-muted-foreground">
                        {formatPlanPrice(plan.price, planCurrency, plan.cycle)}
                      </span>
                    </Button>
                  );
                })}
                {selectedPreset.familyPlan && (
                  <Button
                    type="button"
                    variant="outline"
                    className={`justify-between ${isFamilyPlan ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => handleFamilyPlanSelect(selectedPreset)}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {selectedPreset.familyPlan.name} (
                      {selectedPreset.familyPlan.maxMembers}인 공유)
                    </span>
                    <span className="text-muted-foreground">
                      {formatPlanPrice(
                        selectedPreset.familyPlan.price,
                        selectedPreset.familyPlan.currency || 'KRW',
                        selectedPreset.familyPlan.cycle,
                      )}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* USD Exchange Rate Info */}
          {selectedCurrency === 'USD' && usdPrice > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                <span>💱</span>
                <span>달러 환율 + 부가세 10% 적용</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {formatExchangeInfo(usdPrice, Math.round(convertUSDtoKRW(usdPrice, exchangeRate)), exchangeRate)}
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-500">
                환율: 1 USD = {exchangeRate.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}원 (24시간 캐시)
              </p>
            </div>
          )}

          {/* Family Plan Sharing Options */}
          {isFamilyPlan && (
            <fieldset className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-4">
              <legend className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                <Label className="text-base font-semibold">가족 플랜 비용 분담</Label>
              </legend>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={sharingMode === 'solo' ? 'default' : 'outline'}
                  className="flex items-center gap-2 h-auto py-3"
                  onClick={() => setSharingMode('solo')}
                >
                  <User className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">혼자 부담</div>
                    <div className="text-xs opacity-70">전체 금액을 내가 결제</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={sharingMode === 'split' ? 'default' : 'outline'}
                  className="flex items-center gap-2 h-auto py-3"
                  onClick={() => setSharingMode('split')}
                >
                  <Users className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">N빵</div>
                    <div className="text-xs opacity-70">인원수로 나눠서 분담</div>
                  </div>
                </Button>
              </div>

              {sharingMode === 'split' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">공유 인원</span>
                    <span className="text-lg font-bold text-primary">{memberCount}명</span>
                  </div>
                  <Slider
                    value={[memberCount]}
                    onValueChange={(v) => setMemberCount(v[0])}
                    min={2}
                    max={maxMembers}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>2명</span>
                    <span>최대 {maxMembers}명</span>
                  </div>

                  <div className="rounded-lg bg-background p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">총 요금</span>
                      <span>{formatKRW(familyPlanFullPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">나누기</span>
                      <span>{memberCount}명</span>
                    </div>
                    <div className="border-t pt-1 flex justify-between font-semibold">
                      <span>내가 낼 금액</span>
                      <span className="text-primary text-lg">{formatKRW(splitPrice)}</span>
                    </div>
                  </div>
                </div>
              )}
            </fieldset>
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
                disabled={isFamilyPlan && sharingMode === 'split'}
              />
              {isFamilyPlan && sharingMode === 'split' && (
                <p className="text-xs text-muted-foreground">
                  자동 계산됨 (N빵)
                </p>
              )}
              {selectedCurrency === 'USD' && usdPrice > 0 && !isFamilyPlan && (
                <p className="text-xs text-muted-foreground">
                  환율 자동 적용됨 (${usdPrice.toFixed(2)})
                </p>
              )}
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
