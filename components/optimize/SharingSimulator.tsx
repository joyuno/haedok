'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { calculateSharingSavings } from '@/lib/calculations/sharingOptimize';
import type { SharingOpportunity } from '@/lib/calculations/sharingOptimize';
import { Users, TrendingDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { BrandIcon } from '@/components/subscription/BrandIcon';

interface SharingSimulatorProps {
  opportunity: SharingOpportunity;
}

export function SharingSimulator({ opportunity }: SharingSimulatorProps) {
  const [memberCount, setMemberCount] = useState(opportunity.maxMembers);

  const currentSavings = calculateSharingSavings(
    opportunity.individualPrice,
    opportunity.familyPlanPrice,
    opportunity.maxMembers,
    memberCount,
  );

  const pricePerMember = Math.ceil(opportunity.familyPlanPrice / memberCount);
  const savingsPercentage = Math.round(
    (currentSavings / opportunity.individualPrice) * 100,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <BrandIcon name={opportunity.subscription.name} icon={opportunity.subscription.icon} size="sm" />
            <div>
              <CardTitle className="text-lg">
                {opportunity.subscription.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {opportunity.familyPlanName}
              </p>
            </div>
          </div>
          {savingsPercentage > 0 && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              {savingsPercentage}% 절약
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current vs Shared Price */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">현재 개인 요금</p>
            <p className="text-2xl font-bold text-muted-foreground line-through">
              {formatKRW(opportunity.individualPrice)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">공유 시 인당 요금</p>
            <p className="text-2xl font-bold text-primary">
              {formatKRW(pricePerMember)}
            </p>
          </div>
        </div>

        {/* Member Count Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium">공유 인원</span>
            </div>
            <span className="text-lg font-bold">
              {memberCount}명
            </span>
          </div>
          <Slider
            value={[memberCount]}
            onValueChange={(value) => setMemberCount(value[0])}
            min={2}
            max={opportunity.maxMembers}
            step={1}
            className="w-full"
            aria-label={`${opportunity.subscription.name} 공유 인원 선택`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>2명</span>
            <span>최대 {opportunity.maxMembers}명</span>
          </div>
        </div>

        {/* Savings Highlight */}
        <div className="rounded-lg bg-primary/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-semibold text-primary">
              월 {formatKRW(currentSavings)} 절약
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {memberCount}명이 함께 사용하면 연간 {formatKRW(currentSavings * 12)} 절약 가능
          </p>
        </div>

        {/* Action Button */}
        <Link href="/party" className="block">
          <Button className="w-full" size="lg">
            공유 파티 만들기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>

        {/* Break-even Info */}
        <p className="text-xs text-center text-muted-foreground">
          최소 {opportunity.breakEvenMembers}명 이상일 때 개인 요금보다 저렴해요
        </p>
      </CardContent>
    </Card>
  );
}
