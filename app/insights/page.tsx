'use client';

import { useSubscriptionStore } from '@/stores/subscriptionStore';
import {
  SubscriptionDNA,
  DNARadarChart,
  CostFeelingMeter,
  OpportunityCostSimulator,
  ChallengeTracker,
} from '@/components/innovation';
import { Sparkles } from 'lucide-react';

export default function InsightsPage() {
  const getActiveSubscriptions = useSubscriptionStore((s) => s.getActiveSubscriptions);
  const activeSubscriptions = getActiveSubscriptions();

  if (activeSubscriptions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <Sparkles className="h-9 w-9 text-primary" />
            구독 인사이트
          </h1>
          <p className="text-muted-foreground text-lg">
            AI 분석으로 구독을 더 똑똑하게 관리하세요
          </p>
        </div>

        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center max-w-md">
            <div className="text-7xl mb-6">🔍</div>
            <h2 className="text-3xl font-bold mb-4">아직 구독이 없어요</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              구독을 추가하면 당신의 구독 DNA, 돈값 미터, 만약에 계산기 등<br />
              다양한 인사이트를 확인할 수 있어요!
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 hover:shadow-lg transition-all duration-200"
            >
              구독 추가하기
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
          <Sparkles className="h-9 w-9 text-primary" />
          구독 인사이트
        </h1>
        <p className="text-muted-foreground text-lg">
          AI 분석으로 구독을 더 똑똑하게 관리하세요
        </p>
      </div>

      <div className="space-y-12">
        {/* Section 1: Subscription DNA - Most Visual */}
        <section>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SubscriptionDNA />
            </div>
            <div className="lg:col-span-1">
              <DNARadarChart />
            </div>
          </div>
        </section>

        <div className="border-t border-border" />

        {/* Section 2: Cost Feeling Meter */}
        <section>
          <CostFeelingMeter />
        </section>

        <div className="border-t border-border" />

        {/* Section 3: Opportunity Cost Simulator */}
        <section>
          <OpportunityCostSimulator />
        </section>

        <div className="border-t border-border" />

        {/* Section 4: Challenge Tracker */}
        <section>
          <ChallengeTracker />
        </section>
      </div>

      {/* Footer CTA */}
      <div className="mt-16 rounded-3xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-2 border-primary/20 p-10 text-center">
        <h3 className="text-3xl font-bold mb-3">더 똑똑한 구독 관리</h3>
        <p className="text-muted-foreground mb-8 text-lg">
          SubScout와 함께 불필요한 구독을 정리하고 절약해보세요
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 hover:shadow-lg transition-all duration-200"
          >
            대시보드로 가기
          </a>
          <a
            href="/optimize"
            className="inline-flex items-center justify-center rounded-2xl border border-input bg-background px-8 py-4 text-base font-semibold hover:bg-accent hover:text-accent-foreground transition-all duration-200"
          >
            절약 플랜 보기
          </a>
        </div>
      </div>
    </div>
  );
}
