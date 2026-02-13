'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { findSharingOpportunities } from '@/lib/calculations/sharingOptimize';
import { analyzeBundleOptimization } from '@/lib/calculations/bundleOptimize';
import {
  OptimizeSummary,
  SharingSimulator,
  PlanComparison,
  BundleOptimizer,
  DiscountEvents,
} from '@/components/optimize';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingDown, Users, Package, Lightbulb, Percent } from 'lucide-react';

export default function OptimizePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const allSubscriptions = useSubscriptionStore((state) => state.subscriptions);

  const subscriptions = useMemo(
    () => allSubscriptions.filter((s) => s.status === 'active' || s.status === 'trial'),
    [allSubscriptions],
  );

  const sharingOpportunities = useMemo(
    () => findSharingOpportunities(subscriptions),
    [subscriptions],
  );

  const bundleOptimizations = useMemo(
    () => analyzeBundleOptimization(subscriptions),
    [subscriptions],
  );

  const totalSharingSavings = useMemo(
    () => sharingOpportunities.reduce((sum, opp) => sum + opp.savingsPerPerson, 0),
    [sharingOpportunities],
  );

  const totalBundleSavings = useMemo(
    () => bundleOptimizations.reduce((sum, opt) => sum + opt.monthlySavings, 0),
    [bundleOptimizations],
  );

  if (!mounted) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <TrendingDown className="h-9 w-9" aria-hidden="true" />
            구독 최적화
          </h1>
          <p className="text-muted-foreground text-lg">
            구독료를 절약할 수 있는 최적의 방법을 찾아드려요
          </p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-2xl" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  // Empty state
  if (subscriptions.length === 0) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <TrendingDown className="h-9 w-9" aria-hidden="true" />
            구독 최적화
          </h1>
          <p className="text-muted-foreground text-lg">
            구독료를 절약할 수 있는 최적의 방법을 찾아드려요
          </p>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="py-20 text-center">
            <Lightbulb className="h-20 w-20 mx-auto text-muted-foreground/30 mb-6" />
            <h3 className="text-2xl font-bold mb-3">
              구독을 먼저 추가해주세요
            </h3>
            <p className="text-muted-foreground mb-8 text-lg">
              구독 서비스를 등록하면 절약 기회를 자동으로 찾아드립니다
            </p>
            <a
              href="/subscriptions"
              className="inline-flex items-center justify-center rounded-2xl text-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg px-8 py-4"
            >
              구독 추가하러 가기
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="container max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
          <TrendingDown className="h-9 w-9" aria-hidden="true" />
          구독 최적화
        </h1>
        <p className="text-muted-foreground text-lg">
          공유와 번들로 구독료를 절약하는 최적의 방법을 찾아드려요
        </p>
      </div>

      {/* Summary */}
      <OptimizeSummary
        sharingSavings={totalSharingSavings}
        bundleSavings={totalBundleSavings}
      />

      {/* Main Content Tabs */}
      <Tabs defaultValue="sharing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 rounded-xl p-1.5 bg-accent">
          <TabsTrigger
            value="sharing"
            className="flex items-center gap-2 rounded-lg font-semibold"
          >
            <Users className="h-4 w-4" />
            <span>공유 최적화</span>
            {sharingOpportunities.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground font-bold">
                {sharingOpportunities.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="bundle"
            className="flex items-center gap-2 rounded-lg font-semibold"
          >
            <Package className="h-4 w-4" />
            <span>번들 최적화</span>
            {bundleOptimizations.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground font-bold">
                {bundleOptimizations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="discount"
            className="flex items-center gap-2 rounded-lg font-semibold"
          >
            <Percent className="h-4 w-4" />
            <span>할인 이벤트</span>
          </TabsTrigger>
        </TabsList>

        {/* Sharing Optimization Tab */}
        <TabsContent value="sharing" className="space-y-6">
          {sharingOpportunities.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-16 text-center">
                <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-lg font-medium">
                  현재 공유 가능한 구독이 없어요
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  가족 요금제가 있는 서비스를 구독하면 공유 기회를 찾아드릴게요
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  공유로 절약 가능한 구독
                </h2>
                <p className="text-sm text-muted-foreground">
                  가족/친구와 함께 사용하면 비용을 크게 줄일 수 있어요
                </p>
              </div>

              {/* Sharing Simulators */}
              <div className="grid gap-6 md:grid-cols-2">
                {sharingOpportunities.map((opp) => (
                  <SharingSimulator key={opp.subscription.id} opportunity={opp} />
                ))}
              </div>

              {/* Plan Comparisons */}
              <div>
                <h2 className="text-xl font-semibold mb-4">요금제 비교</h2>
                <div className="space-y-4">
                  {sharingOpportunities.map((opp) => (
                    <PlanComparison key={opp.subscription.id} opportunity={opp} />
                  ))}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Bundle Optimization Tab */}
        <TabsContent value="bundle" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">번들 묶음 추천</h2>
            <p className="text-sm text-muted-foreground">
              여러 서비스를 하나의 멤버십으로 통합하면 더 저렴해요
            </p>
          </div>

          <BundleOptimizer optimizations={bundleOptimizations} />
        </TabsContent>

        {/* Discount Events Tab */}
        <TabsContent value="discount" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">할인 이벤트</h2>
            <p className="text-sm text-muted-foreground">
              카드 할인, 통신사 혜택, 프로모션 등 구독료를 아낄 수 있는 정보를 모았어요
            </p>
          </div>

          <DiscountEvents subscriptions={subscriptions} />
        </TabsContent>
      </Tabs>

      {/* CTA Footer */}
      {(sharingOpportunities.length > 0 || bundleOptimizations.length > 0) && (
        <Card className="border-2 border-primary/20 bg-primary/5 rounded-2xl">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-3">
              지금 바로 절약을 시작하세요!
            </h3>
            <p className="text-base text-muted-foreground mb-6">
              공유 파티를 만들거나 번들 멤버십으로 전환해보세요
            </p>
            <a
              href="/party"
              className="inline-flex items-center justify-center rounded-2xl text-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg px-8 py-4"
            >
              공유 파티 시작하기
            </a>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
