'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUsageStore } from '@/stores/usageStore';
import type { Subscription } from '@/lib/types/subscription';
import { ExternalLink, Star } from 'lucide-react';
import Link from 'next/link';

interface UsageInputFormProps {
  subscriptions: Subscription[];
  onComplete?: () => void;
}

type FeelingLevel = 'always' | 'often' | 'sometimes' | 'rarely' | 'never';

const FEELING_MINUTES: Record<FeelingLevel, number> = {
  always: 840, // ~2hrs/day
  often: 420, // ~1hr/day
  sometimes: 180, // ~25min/day
  rarely: 60, // ~8min/day
  never: 0,
};

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
        const minutes = parseInt(value, 10);
        if (minutes > 0) {
          addUsage(subscriptionId, weekStartStr, minutes, 'manual');
          count++;
        }
      });
    } else {
      Object.entries(feelingData).forEach(([subscriptionId, level]) => {
        const minutes = FEELING_MINUTES[level];
        addUsage(subscriptionId, weekStartStr, minutes, 'feeling');
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

  const feelingOptions: Array<{ value: FeelingLevel; label: string; stars: number }> = [
    { value: 'always', label: '매일 사용', stars: 5 },
    { value: 'often', label: '주 3-4회', stars: 4 },
    { value: 'sometimes', label: '주 1-2회', stars: 3 },
    { value: 'rarely', label: '거의 안 씀', stars: 2 },
    { value: 'never', label: '미사용', stars: 1 },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>주간 사용량 입력</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              지난 주 사용 시간을 입력해주세요
            </p>
          </div>
          <Link
            href="/guide"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            스크린타임 확인 방법
            <ExternalLink className="h-3 w-3" />
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
                return (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <span className="text-2xl">{sub.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{sub.name}</p>
                      {existing && (
                        <p className="text-xs text-muted-foreground">
                          이전: {existing.usageMinutes}분
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="0"
                        value={usageData[sub.id] || ''}
                        onChange={(e) =>
                          handleManualChange(sub.id, e.target.value)
                        }
                        className="w-24 text-right"
                        min="0"
                      />
                      <Label className="text-sm text-muted-foreground">분</Label>
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
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{sub.icon}</span>
                    <p className="font-medium">{sub.name}</p>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {feelingOptions.map((option) => (
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
                      >
                        <div className="flex gap-0.5 mb-1">
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
              ))}
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
