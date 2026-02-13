'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUsageStore } from '@/stores/usageStore';
import type { Subscription } from '@/lib/types/subscription';
import { CATEGORY_METRIC, METRIC_LABELS, type UsageMetricType } from '@/lib/types/subscription';
import { ExternalLink, Star } from 'lucide-react';
import Link from 'next/link';
import { BrandIcon } from '@/components/subscription/BrandIcon';

interface UsageInputFormProps {
  subscriptions: Subscription[];
  onComplete?: () => void;
}

type FeelingLevel = 'always' | 'often' | 'sometimes' | 'rarely' | 'never';

// Feeling values per metric type
const FEELING_VALUES: Record<UsageMetricType, Record<FeelingLevel, number>> = {
  time: {
    always: 840,   // ~2hrs/day
    often: 420,    // ~1hr/day
    sometimes: 180, // ~25min/day
    rarely: 60,    // ~8min/day
    never: 0,
  },
  count: {
    always: 20,
    often: 12,
    sometimes: 6,
    rarely: 2,
    never: 0,
  },
  frequency: {
    always: 7,
    often: 4.5,
    sometimes: 2,
    rarely: 0.5,
    never: 0,
  },
};

// Feeling option labels per metric type
const FEELING_OPTIONS: Record<
  UsageMetricType,
  Array<{ value: FeelingLevel; label: string; stars: number }>
> = {
  time: [
    { value: 'always', label: '매일 사용', stars: 5 },
    { value: 'often', label: '주 3-4회', stars: 4 },
    { value: 'sometimes', label: '주 1-2회', stars: 3 },
    { value: 'rarely', label: '거의 안 씀', stars: 2 },
    { value: 'never', label: '미사용', stars: 1 },
  ],
  count: [
    { value: 'always', label: '월 20회+', stars: 5 },
    { value: 'often', label: '월 10-15회', stars: 4 },
    { value: 'sometimes', label: '월 4-8회', stars: 3 },
    { value: 'rarely', label: '월 1-3회', stars: 2 },
    { value: 'never', label: '미사용', stars: 1 },
  ],
  frequency: [
    { value: 'always', label: '매일', stars: 5 },
    { value: 'often', label: '주 4-5일', stars: 4 },
    { value: 'sometimes', label: '주 2-3일', stars: 3 },
    { value: 'rarely', label: '주 1일 이하', stars: 2 },
    { value: 'never', label: '미사용', stars: 1 },
  ],
};

// Hint text shown below subscription name in manual mode
const MANUAL_HINTS: Record<UsageMetricType, string> = {
  time: '지난 주 사용 시간',
  count: '이번 달 이용 횟수',
  frequency: '주 평균 사용 일수',
};

// Input config per metric type
const INPUT_CONFIG: Record<UsageMetricType, { min: string; max?: string; step: string }> = {
  time: { min: '0', step: '0.5' },
  count: { min: '0', step: '1' },
  frequency: { min: '0', max: '7', step: '1' },
};

/** Format a previous usage value for display */
function formatExistingUsage(value: number, metricType: UsageMetricType): string {
  switch (metricType) {
    case 'time':
      return `${(value / 60).toFixed(1)}시간`;
    case 'count':
      return `${value}회`;
    case 'frequency':
      return `${value}일`;
  }
}

export function UsageInputForm({
  subscriptions,
  onComplete,
}: UsageInputFormProps) {
  const { addUsage, getLatestUsage } = useUsageStore();
  const [inputMode, setInputMode] = useState<'manual' | 'feeling'>('manual');
  const [usageData, setUsageData] = useState<Record<string, string>>({});
  const [feelingData, setFeelingData] = useState<Record<string, FeelingLevel>>(
    {},
  );

  const today = new Date();
  const weekStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - today.getDay(),
  );
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const handleManualChange = (subscriptionId: string, value: string) => {
    setUsageData((prev) => ({ ...prev, [subscriptionId]: value }));
  };

  const handleFeelingChange = (
    subscriptionId: string,
    level: FeelingLevel,
  ) => {
    setFeelingData((prev) => ({ ...prev, [subscriptionId]: level }));
  };

  const handleSubmit = () => {
    let count = 0;

    if (inputMode === 'manual') {
      Object.entries(usageData).forEach(([subscriptionId, value]) => {
        const parsed = parseFloat(value);
        if (parsed > 0) {
          const sub = subscriptions.find((s) => s.id === subscriptionId);
          const metricType = sub ? CATEGORY_METRIC[sub.category] : 'time';

          if (metricType === 'time') {
            // Convert hours input to minutes for storage
            const minutes = Math.round(parsed * 60);
            addUsage(subscriptionId, weekStartStr, minutes, 'manual', 'time');
          } else if (metricType === 'count') {
            addUsage(subscriptionId, weekStartStr, parsed, 'manual', 'count');
          } else {
            addUsage(subscriptionId, weekStartStr, parsed, 'manual', 'frequency');
          }
          count++;
        }
      });
    } else {
      Object.entries(feelingData).forEach(([subscriptionId, level]) => {
        const sub = subscriptions.find((s) => s.id === subscriptionId);
        const metricType = sub ? CATEGORY_METRIC[sub.category] : 'time';
        const storedValue = FEELING_VALUES[metricType][level];
        addUsage(subscriptionId, weekStartStr, storedValue, 'feeling', metricType);
        count++;
      });
    }

    if (count > 0) {
      alert(`${count}개 구독의 사용량이 저장되었습니다.`);
      setUsageData({});
      setFeelingData({});
      onComplete?.();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>주간 사용량 입력</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              지난 주 사용 시간을 시간 단위로 입력해주세요
            </p>
          </div>
          <Link
            href="/guide"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            스크린타임 확인 방법
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manual">정확히 입력</TabsTrigger>
            <TabsTrigger value="feeling">체감으로 입력</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-3">
              {subscriptions.map((sub) => {
                const existing = getLatestUsage(sub.id);
                const metricType = CATEGORY_METRIC[sub.category];
                const metricLabel = METRIC_LABELS[metricType];
                const config = INPUT_CONFIG[metricType];
                const hint = MANUAL_HINTS[metricType];

                return (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <BrandIcon name={sub.name} icon={sub.icon} size="sm" />
                    <div className="flex-1">
                      <p className="font-medium">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {hint}
                      </p>
                      {existing && (
                        <p className="text-xs text-muted-foreground">
                          이전: {formatExistingUsage(
                            existing.usageMinutes,
                            existing.metricType || metricType,
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder={metricLabel.inputPlaceholder}
                        value={usageData[sub.id] || ''}
                        onChange={(e) =>
                          handleManualChange(sub.id, e.target.value)
                        }
                        className="w-24 text-right"
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        aria-label={`${sub.name} ${hint}`}
                      />
                      <Label className="text-sm text-muted-foreground" aria-hidden="true">
                        {metricLabel.unit}
                      </Label>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="feeling" className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              지난 주 각 서비스를 얼마나 사용했는지 느낌으로 선택해주세요.
            </p>
            <div className="space-y-3">
              {subscriptions.map((sub) => {
                const metricType = CATEGORY_METRIC[sub.category];
                const options = FEELING_OPTIONS[metricType];

                return (
                  <div
                    key={sub.id}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <BrandIcon name={sub.name} icon={sub.icon} size="sm" />
                      <p className="font-medium">{sub.name}</p>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {options.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={
                            feelingData[sub.id] === option.value
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          className="flex-col h-auto py-2"
                          onClick={() => handleFeelingChange(sub.id, option.value)}
                          aria-pressed={feelingData[sub.id] === option.value}
                          aria-label={`${sub.name} 사용량: ${option.label}`}
                        >
                          <div className="flex gap-0.5 mb-1" aria-hidden="true">
                            {Array.from({ length: option.stars }).map((_, i) => (
                              <Star
                                key={i}
                                className="h-3 w-3 fill-current"
                              />
                            ))}
                          </div>
                          <span className="text-xs">{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <Button
          className="w-full mt-6"
          size="lg"
          onClick={handleSubmit}
          disabled={
            inputMode === 'manual'
              ? Object.keys(usageData).length === 0
              : Object.keys(feelingData).length === 0
          }
        >
          사용량 저장
        </Button>
      </CardContent>
    </Card>
  );
}
