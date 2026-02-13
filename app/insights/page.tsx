'use client';

import { useSubscriptionStore } from '@/stores/subscriptionStore';
import {
  SubscriptionDNA,
  DNARadarChart,
  CostFeelingMeter,
  SubscriptionTimeline,
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
            <div className="w-9 h-9 rounded-xl bg-primary/[0.08] flex items-center justify-center" aria-hidden="true">
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
            <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-5" aria-hidden="true">
              <TossEmoji emoji="🔍" size={48} />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-3">아직 구독이 없어요</h2>
            <p className="text-sm text-muted-foreground mb-8 font-medium leading-relaxed">
              구독을 추가하면 당신의 구독 DNA, 구독 체감 온도, 만약에 계산기 등<br />
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
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold mb-1.5 flex items-center gap-2.5 text-foreground">
          <div className="w-9 h-9 rounded-xl bg-primary/[0.08] flex items-center justify-center" aria-hidden="true">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          구독 인사이트
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          AI 분석으로 구독을 더 똑똑하게 관리하세요
        </p>
      </div>

      <div className="space-y-12">
        {/* Section 1: Subscription DNA + 인사이트 요약 */}
        <section className="space-y-6" aria-label="구독 DNA 분석">
          <SubscriptionDNA />
          <DNARadarChart />
        </section>

        <div className="border-t border-border" aria-hidden="true" />

        {/* Section 2: 만약에 이걸 투자한다면?(실제 주가 기반 투자 시뮬레이션) */}
        <section aria-label="만약 투자했다면?">
          <StockInvestmentChart />
        </section>

        <div className="border-t border-border" aria-hidden="true" />

        {/* Section 3: 일일 체감 비용 */}
        <section aria-label="일일 체감 비용">
          <CostFeelingMeter />
        </section>

        <div className="border-t border-border" aria-hidden="true" />

        {/* Section 4: Subscription Timeline */}
        <section aria-label="구독 타임라인">
          <SubscriptionTimeline />
        </section>
      </div>

      {/* Footer CTA -- refined gradient card */}
      <div className="relative mt-16 rounded-3xl overflow-hidden p-10 text-center isolate">
        {/* Gradient background layer */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.06] via-primary/[0.03] to-transparent" aria-hidden="true" />
        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
          aria-hidden="true"
        />
        {/* Top accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full" aria-hidden="true" />

        <h3 className="text-2xl font-extrabold text-foreground mb-2">
          더 똑똑한 구독 관리
        </h3>
        <p className="text-sm text-muted-foreground mb-8 font-medium">
          해독와 함께 불필요한 구독을 정리하고 절약해보세요
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href="/"
            className="group relative inline-flex items-center justify-center rounded-xl bg-primary px-7 py-3 text-sm font-bold text-primary-foreground transition-all duration-300 hover:shadow-[0_4px_24px_rgba(var(--primary-rgb,0,0,0),0.25)] hover:scale-[1.03] active:scale-[0.98]"
          >
            <span className="relative z-10">대시보드로 가기</span>
            <span className="absolute inset-0 rounded-xl bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          <a
            href="/optimize"
            className="group relative inline-flex items-center justify-center rounded-xl border border-border bg-card/80 backdrop-blur-sm px-7 py-3 text-sm font-bold text-foreground transition-all duration-300 hover:border-primary/30 hover:bg-accent hover:shadow-md hover:scale-[1.03] active:scale-[0.98]"
          >
            절약 플랜 보기
          </a>
        </div>
      </div>
    </main>
  );
}
