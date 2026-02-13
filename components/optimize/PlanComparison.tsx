'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatKRW } from '@/lib/utils/formatCurrency';
import type { SharingOpportunity } from '@/lib/calculations/sharingOptimize';
import { Check, X } from 'lucide-react';
import { BrandIcon } from '@/components/subscription/BrandIcon';

interface PlanComparisonProps {
  opportunity: SharingOpportunity;
}

export function PlanComparison({ opportunity }: PlanComparisonProps) {
  const savingsPercentage = Math.round(
    (opportunity.savingsPerPerson / opportunity.individualPrice) * 100,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <BrandIcon name={opportunity.subscription.name} icon={opportunity.subscription.icon} size="sm" />
          <div>
            <CardTitle className="text-lg">
              {opportunity.subscription.name} 요금제 비교
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              가족 요금제로 전환하면 최대 {savingsPercentage}% 절약
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Current Individual Plan */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">현재 요금제</h4>
              <Badge variant="outline">개인</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">월 요금</span>
                <span className="font-semibold">
                  {formatKRW(opportunity.individualPrice)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">사용 인원</span>
                <span className="font-semibold">1명</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">인당 비용</span>
                <span className="font-semibold">
                  {formatKRW(opportunity.individualPrice)}
                </span>
              </div>
            </div>
            <div className="pt-3 border-t space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <X className="h-4 w-4 text-red-500 dark:text-red-400" aria-hidden="true" />
                <span className="text-muted-foreground">비용 절감 불가</span>
              </div>
            </div>
          </div>

          {/* Family Plan */}
          <div className="border-2 border-primary rounded-lg p-4 space-y-3 bg-primary/5">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-primary">추천 요금제</h4>
              <Badge className="bg-primary">가족</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">월 요금</span>
                <span className="font-semibold">
                  {formatKRW(opportunity.familyPlanPrice)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">최대 인원</span>
                <span className="font-semibold">{opportunity.maxMembers}명</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">인당 비용</span>
                <span className="font-semibold text-primary">
                  {formatKRW(opportunity.pricePerMember)}
                </span>
              </div>
            </div>
            <div className="pt-3 border-t space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 dark:text-green-400" aria-hidden="true" />
                <span className="font-medium text-primary">
                  인당 월 {formatKRW(opportunity.savingsPerPerson)} 절약
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 dark:text-green-400" aria-hidden="true" />
                <span className="text-muted-foreground">
                  {opportunity.maxMembers}명 동시 사용 가능
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Break-even Point */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-center text-muted-foreground">
            💡 <span className="font-medium text-foreground">{opportunity.breakEvenMembers}명</span> 이상이 함께 사용하면 개인 요금보다 저렴해요
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
