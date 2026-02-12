'use client';

import { useSubscriptionStore } from '@/stores/subscriptionStore';
import {
  SubscriptionDNA,
  DNARadarChart,
  CostFeelingMeter,
  ChallengeTracker,
  SubscriptionTimeline,
  OptimalPortfolio,
  PatternPredictor,
  StockInvestmentChart,
} from '@/components/innovation';
import { Sparkles } from 'lucide-react';
import { TossEmoji } from '@/components/ui/TossEmoji';

export default function InsightsPage() {
  const getActiveSubscriptions = useSubscriptionStore((s) => s.getActiveSubscriptions);
  const activeSubscriptions = getActiveSubscriptions();

  if (activeSubscriptions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold mb-1.5 flex items-center gap-2.5 text-foreground">
            <div className="w-9 h-9 rounded-xl bg-primary/[0.08] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            구독 인사이트
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            AI 분석으로 구독을 더 똑똑하게 관리하세요
          </p>
        </div>

        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
              <TossEmoji emoji="🔍" size={48} />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-3">아직 구독이 없어요</h2>
            <p className="text-sm text-muted-foreground mb-8 font-medium leading-relaxed">
              구독을 추가하면 당신의 구독 DNA, 돈값 미터, 만약에 계산기 등<br />
              다양한 인사이트를 확인할 수 있어요!
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 hover:shadow-lg transition-all duration-200"
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
        <h1 className="text-3xl font-extrabold mb-1.5 flex items-center gap-2.5 text-foreground">
          <div className="w-9 h-9 rounded-xl bg-primary/[0.08] flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          구독 인사이트
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          AI 분석으로 구독을 더 똑똑하게 관리하세요
        </p>
      </div>

      <div className="space-y-12">
        {/* Section 1: Subscription DNA */}
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

        {/* Section 3: 만약에 계산기 (실제 주가 기반 투자 시뮬레이션) */}
        <section>
          <StockInvestmentChart />
        </section>

        <div className="border-t border-border" />

        {/* Section 4: Challenge Tracker */}
        <section>
          <ChallengeTracker />
        </section>

        <div className="border-t border-border" />

        {/* Section 5: Subscription Timeline */}
        <section>
          <SubscriptionTimeline />
        </section>

        <div className="border-t border-border" />

        {/* Section 6: Optimal Portfolio */}
        <section>
          <OptimalPortfolio />
        </section>

        <div className="border-t border-border" />

        {/* Section 7: Pattern Predictor */}
        <section>
          <PatternPredictor />
        </section>
      </div>

      {/* Footer CTA -- Toss-style clean card */}
      <div className="mt-16 rounded-2xl bg-card border border-border p-10 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <h3 className="text-2xl font-extrabold text-foreground mb-2">더 똑똑한 구독 관리</h3>
        <p className="text-sm text-muted-foreground mb-8 font-medium">
          SubScout와 함께 불필요한 구독을 정리하고 절약해보세요
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-7 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 hover:shadow-lg transition-all duration-200"
          >
            대시보드로 가기
          </a>
          <a
            href="/optimize"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-7 py-3 text-sm font-bold text-foreground hover:bg-accent transition-all duration-200"
          >
            절약 플랜 보기
          </a>
        </div>
      </div>
    </div>
  );
}
