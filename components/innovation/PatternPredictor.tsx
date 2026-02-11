'use client';

import { useMemo } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { CATEGORY_LABELS, type SubscriptionCategory } from '@/lib/types/subscription';
import type { Subscription } from '@/lib/types/subscription';
import { BrandIcon } from '@/components/subscription/BrandIcon';
import { SERVICE_PRESETS } from '@/lib/constants/servicePresets';
import { findSharingOpportunities } from '@/lib/calculations/sharingOptimize';
import { analyzeBundleOptimization } from '@/lib/calculations/bundleOptimize';
import { findMatchingEvents } from '@/lib/constants/discountEvents';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────
type Confidence = 'high' | 'medium' | 'low';

interface Prediction {
  id: string;
  title: string;
  value: string;
  description: string;
  confidence: Confidence;
  icon: string;
  color: string;
}

interface TrendDataPoint {
  month: string;
  cost: number;
  predicted?: boolean;
}

// ── Confidence styling ─────────────────────────────────────────────────
const CONFIDENCE_META: Record<Confidence, { label: string; color: string; bg: string }> = {
  high:   { label: '높음', color: '#1FC08E', bg: 'rgba(31,192,142,0.10)' },
  medium: { label: '중간', color: '#FFA826', bg: 'rgba(255,168,38,0.10)' },
  low:    { label: '낮음', color: '#94a3b8', bg: 'rgba(148,163,184,0.10)' },
};

// ── Helper functions ───────────────────────────────────────────────────
function getMonthLabel(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getMonth() + 1}월`;
}

function getMonthKey(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Count subscriptions that were active at a given month offset.
 * Uses createdAt to determine when subs were added.
 */
function getSubsAtMonth(
  allSubs: Subscription[],
  cancelledSubs: Subscription[],
  monthOffset: number,
): Subscription[] {
  const target = new Date();
  target.setMonth(target.getMonth() + monthOffset);
  const targetEnd = new Date(target.getFullYear(), target.getMonth() + 1, 0); // end of target month

  return allSubs.filter((sub) => {
    const created = new Date(sub.createdAt || new Date().toISOString());
    if (created > targetEnd) return false; // not yet created

    // Check if it was cancelled before target month
    const cancelled = cancelledSubs.find((c) => c.id === sub.id);
    if (cancelled && sub.status === 'cancelled') {
      const cancelDate = new Date(cancelled.updatedAt || new Date().toISOString());
      if (cancelDate < new Date(target.getFullYear(), target.getMonth(), 1)) return false;
    }

    return true;
  });
}

// ── Component ──────────────────────────────────────────────────────────
export function PatternPredictor() {
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const cancelledSubscriptions = useSubscriptionStore((s) => s.cancelledSubscriptions);
  const getActiveSubscriptions = useSubscriptionStore((s) => s.getActiveSubscriptions);
  const getTotalMonthlyCost = useSubscriptionStore((s) => s.getTotalMonthlyCost);

  const activeSubscriptions = useMemo(() => getActiveSubscriptions(), [subscriptions, getActiveSubscriptions]);
  const currentMonthlyCost = useMemo(() => getTotalMonthlyCost(), [subscriptions, getTotalMonthlyCost]);

  const analysis = useMemo(() => {
    if (activeSubscriptions.length === 0) return null;

    // ── 1. Monthly trend (past 3 months + 1 month prediction) ──
    const trendData: TrendDataPoint[] = [];
    for (let offset = -2; offset <= 0; offset++) {
      const subs = getSubsAtMonth(subscriptions, cancelledSubscriptions, offset);
      const activeSubs = subs.filter((s) => s.status === 'active' || s.status === 'trial');
      const cost = activeSubs.reduce((sum, s) => sum + s.monthlyPrice, 0);
      trendData.push({
        month: getMonthLabel(offset),
        cost: cost || currentMonthlyCost, // fallback if no historical data
      });
    }

    // ── 2. Trial ending subs (free trial ending within 30 days) ──
    const trialEndingSubs = activeSubscriptions.filter((sub) => {
      if (sub.status !== 'trial' || !sub.trialEndDate) return false;
      const endDate = new Date(sub.trialEndDate);
      const now = new Date();
      const daysUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilEnd > 0 && daysUntilEnd <= 30;
    });

    const trialEndingCost = trialEndingSubs.reduce((sum, s) => sum + s.monthlyPrice, 0);
    const predictedNextMonth = currentMonthlyCost + trialEndingCost;

    // Add predicted month
    trendData.push({
      month: getMonthLabel(1),
      cost: predictedNextMonth,
      predicted: true,
    });

    // ── 3. Subscription growth trend ──
    const monthCounts = [-2, -1, 0].map((offset) => {
      const subs = getSubsAtMonth(subscriptions, cancelledSubscriptions, offset);
      return subs.filter((s) => s.status === 'active' || s.status === 'trial').length;
    });

    // If all counts are the same (likely no historical variation), use current
    const actualCounts = monthCounts.map((c) => c || activeSubscriptions.length);
    const growthTrend = actualCounts[2] - actualCounts[0]; // difference from 2 months ago to now
    let growthLabel: string;
    let growthConfidence: Confidence;

    if (growthTrend > 1) {
      growthLabel = `최근 3개월간 ${growthTrend}개 증가`;
      growthConfidence = 'high';
    } else if (growthTrend > 0) {
      growthLabel = `최근 3개월간 ${growthTrend}개 소폭 증가`;
      growthConfidence = 'medium';
    } else if (growthTrend < 0) {
      growthLabel = `최근 3개월간 ${Math.abs(growthTrend)}개 감소`;
      growthConfidence = 'high';
    } else {
      growthLabel = '최근 3개월간 변화 없음';
      growthConfidence = 'high';
    }

    // ── 3.5 Exchange rate risk for USD subscriptions ──
    const usdSubscriptions = activeSubscriptions.filter((sub) => {
      const preset = SERVICE_PRESETS[sub.name];
      if (!preset) return false;
      const currentPlan = preset.plans.find(
        (p) =>
          (p.cycle === 'yearly' ? Math.round(p.price / 12) : p.price) === sub.monthlyPrice ||
          p.price === sub.price,
      );
      return currentPlan?.currency === 'USD' || preset.plans.some((p) => p.currency === 'USD');
    });
    const hasUsdSubscriptions = usdSubscriptions.length > 0;
    // Approximate USD exposure: count subs whose names imply foreign service
    const foreignServiceNames = ['넷플릭스', '디즈니+', '스포티파이', 'Apple Music', 'Apple TV+', 'ChatGPT', 'Canva', '피그마', 'Dropbox', 'Amazon Prime', 'YouTube Music'];
    const foreignSubs = activeSubscriptions.filter((sub) =>
      foreignServiceNames.some((name) => sub.name.includes(name) || name.includes(sub.name)),
    );
    const foreignExposure = foreignSubs.reduce((sum, s) => sum + s.monthlyPrice, 0);
    const exchangeRateRisk = foreignExposure > 0 ? Math.round(foreignExposure * 0.05) : 0; // 5% volatility assumption

    // ── 4. Savings potential (detailed: bundle/discount/sharing) ──
    // Find subs that might be worth cancelling: lowest monthlyPrice, or duplicates in same category
    const categoryGroups: Record<string, Subscription[]> = {};
    for (const sub of activeSubscriptions) {
      if (!categoryGroups[sub.category]) categoryGroups[sub.category] = [];
      categoryGroups[sub.category].push(sub);
    }

    const cancelCandidates: Subscription[] = [];
    for (const [, subs] of Object.entries(categoryGroups)) {
      if (subs.length >= 2) {
        // If multiple subs in same category, cheapest one might be redundant
        const sorted = [...subs].sort((a, b) => a.monthlyPrice - b.monthlyPrice);
        cancelCandidates.push(sorted[0]);
      }
    }

    // Detailed savings breakdown
    const bundleOptimizations = analyzeBundleOptimization(activeSubscriptions);
    const bundleSavings = bundleOptimizations.reduce((s, o) => s + o.monthlySavings, 0);

    const sharingOpps = findSharingOpportunities(activeSubscriptions);
    const sharingSavings = sharingOpps.reduce((s, o) => s + o.savingsPerPerson, 0);

    const serviceNames = activeSubscriptions.map((sub) => sub.name);
    const matchingEvents = findMatchingEvents(serviceNames);
    const cardDiscountEvents = matchingEvents.filter((e) => e.type === 'card');
    let discountSavings = 0;
    for (const event of cardDiscountEvents) {
      for (const sub of activeSubscriptions) {
        const matches = event.targetServices.some(
          (t) => sub.name.includes(t) || t.includes(sub.name),
        );
        if (!matches) continue;
        if (event.discountAmount) {
          discountSavings += Math.min(event.discountAmount, sub.monthlyPrice);
        } else if (event.discountPercent) {
          discountSavings += Math.round((sub.monthlyPrice * event.discountPercent) / 100);
        }
        break; // one event per sub for estimation
      }
    }

    const savingsPotential = cancelCandidates.reduce((sum, s) => sum + s.monthlyPrice, 0);
    const totalDetailedSavings = bundleSavings + sharingSavings + discountSavings + savingsPotential;
    const savingsScore = Math.min(
      100,
      Math.round((totalDetailedSavings / Math.max(currentMonthlyCost, 1)) * 100),
    );

    // ── 5. Top 3 most important subscriptions ──
    // Score = monthlyPrice * category diversity bonus
    const usedCategories = new Set(activeSubscriptions.map((s) => s.category));
    const top3 = [...activeSubscriptions]
      .map((sub) => {
        const categoryCount = categoryGroups[sub.category]?.length || 1;
        // Higher price + unique category = more important
        const diversityBonus = categoryCount === 1 ? 1.5 : 1.0;
        const score = sub.monthlyPrice * diversityBonus;
        return { sub, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.sub);

    // ── Build predictions ──
    const predictions: Prediction[] = [
      {
        id: 'growth',
        title: '구독 증가 추세',
        value: `${activeSubscriptions.length}개`,
        description: growthLabel,
        confidence: growthConfidence,
        icon: growthTrend > 0 ? '📈' : growthTrend < 0 ? '📉' : '📊',
        color: growthTrend > 0 ? '#F04452' : growthTrend < 0 ? '#1FC08E' : '#3182F6',
      },
      {
        id: 'nextMonth',
        title: '다음 달 예상 구독료',
        value: formatKRW(predictedNextMonth),
        description:
          trialEndingSubs.length > 0
            ? `무료체험 종료 ${trialEndingSubs.length}건 포함 (+${formatKRW(trialEndingCost)})` +
              (foreignSubs.length > 0 ? ` | USD 결제 ${foreignSubs.length}건 환율 변동 리스크 ~${formatKRW(exchangeRateRisk)}` : '')
            : foreignSubs.length > 0
              ? `USD 결제 ${foreignSubs.length}건 존재 (환율 변동 시 ~${formatKRW(exchangeRateRisk)} 변동 가능)`
              : '현재와 동일한 수준 예상',
        confidence: trialEndingSubs.length > 0 ? 'high' : foreignSubs.length > 0 ? 'medium' : 'medium',
        icon: '💰',
        color: '#3182F6',
      },
      {
        id: 'savings',
        title: '절약 가능성',
        value: totalDetailedSavings > 0 ? formatKRW(totalDetailedSavings) : '없음',
        description:
          totalDetailedSavings > 0
            ? [
                bundleSavings > 0 ? `번들 ${formatKRW(bundleSavings)}` : '',
                sharingSavings > 0 ? `공유 ${formatKRW(sharingSavings)}` : '',
                discountSavings > 0 ? `할인 ${formatKRW(discountSavings)}` : '',
                savingsPotential > 0 ? `중복정리 ${formatKRW(savingsPotential)}` : '',
              ]
                .filter(Boolean)
                .join(' + ')
            : '중복 구독이 없어요. 잘 관리하고 계시네요!',
        confidence: totalDetailedSavings > 0 ? 'high' : 'low',
        icon: '✂️',
        color: '#1FC08E',
      },
    ];

    return {
      predictions,
      trendData,
      top3,
      savingsScore,
      cancelCandidates,
      predictedNextMonth,
      foreignSubs,
      exchangeRateRisk,
      bundleSavings,
      sharingSavings,
      discountSavings,
    };
  }, [activeSubscriptions, subscriptions, cancelledSubscriptions, currentMonthlyCost, getActiveSubscriptions, getTotalMonthlyCost]);

  if (!analysis || activeSubscriptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-foreground mb-1">패턴 예측</h3>
        <p className="text-sm text-muted-foreground font-medium">구독 패턴을 분석하여 다음 달을 예측해요</p>
      </div>

      {/* Prediction Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {analysis.predictions.map((pred) => {
          const conf = CONFIDENCE_META[pred.confidence];
          return (
            <div
              key={pred.id}
              className="rounded-2xl border border-border bg-card p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-border/80 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{pred.icon}</span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: conf.color, backgroundColor: conf.bg }}
                >
                  신뢰도 {conf.label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-semibold mb-1">{pred.title}</div>
              <div
                className="text-2xl font-extrabold tracking-tight mb-2"
                style={{ color: pred.color }}
              >
                {pred.value}
              </div>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                {pred.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Trend Chart */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-bold text-foreground mb-5">3개월 추이 + 1개월 예측</h4>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={analysis.trendData}>
            <defs>
              <linearGradient id="patternGradActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3182F6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3182F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="none"
              stroke="var(--color-border, hsl(var(--border)))"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: 'var(--color-muted-foreground, #6b7280)', fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--color-muted-foreground, #6b7280)', fontSize: 11, fontWeight: 500 }}
              tickFormatter={(v) => `${Math.round(v / 1000)}K`}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-card, hsl(var(--card)))',
                color: 'var(--color-foreground, hsl(var(--foreground)))',
                border: '1px solid var(--color-border, hsl(var(--border)))',
                borderRadius: '16px',
                padding: '12px 16px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                fontSize: '13px',
                fontWeight: 500,
              }}
              labelStyle={{
                color: 'var(--color-muted-foreground, #6b7280)',
                fontWeight: 700,
                fontSize: '13px',
                marginBottom: '4px',
              }}
              formatter={(value) => {
                if (value == null) return '';
                return formatKRW(value as number);
              }}
            />
            {/* Actual data area */}
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#3182F6"
              fillOpacity={1}
              fill="url(#patternGradActual)"
              strokeWidth={2.5}
              dot={{ fill: '#3182F6', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#3182F6', fill: 'var(--color-card, white)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#3182F6] rounded-full" />
            <span className="text-[11px] text-muted-foreground font-medium">실제</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#3182F6] rounded-full opacity-50" style={{ borderTop: '1px dashed #3182F6' }} />
            <span className="text-[11px] text-muted-foreground font-medium">예측</span>
          </div>
        </div>
      </div>

      {/* Top 3 Important Subscriptions */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-bold text-foreground mb-4">가장 중요한 구독 TOP 3</h4>
        <div className="space-y-3">
          {analysis.top3.map((sub, idx) => {
            const medals = ['#FFD700', '#C0C0C0', '#CD7F32'];
            return (
              <div
                key={sub.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors duration-200"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0"
                  style={{ backgroundColor: medals[idx] }}
                >
                  {idx + 1}
                </div>
                <BrandIcon name={sub.name} icon={sub.icon} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{sub.name}</div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {CATEGORY_LABELS[sub.category as SubscriptionCategory]}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold text-foreground tabular-nums">
                    {formatKRW(sub.monthlyPrice)}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium">/월</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exchange Rate Risk Warning */}
      {analysis.foreignSubs.length > 0 && (
        <div className="rounded-2xl bg-[#3182F6]/[0.04] border border-[#3182F6]/10 p-6">
          <h4 className="text-xs font-bold text-[#3182F6] tracking-wide uppercase mb-3">
            USD 결제 환율 변동 리스크
          </h4>
          <p className="text-xs text-muted-foreground font-medium mb-3">
            원/달러 환율 변동 시 월 구독료가 ~{formatKRW(analysis.exchangeRateRisk)} 변동할 수 있어요
          </p>
          <div className="space-y-2">
            {analysis.foreignSubs.map((sub: Subscription) => (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-card/60">
                <div className="flex items-center gap-2.5">
                  <BrandIcon name={sub.name} icon={sub.icon} size="sm" />
                  <span className="text-sm font-semibold text-foreground">{sub.name}</span>
                </div>
                <span className="text-xs font-bold text-[#3182F6] tabular-nums">
                  {formatKRW(sub.monthlyPrice)}/월
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Candidates */}
      {analysis.cancelCandidates.length > 0 && (
        <div className="rounded-2xl bg-[#F04452]/[0.04] border border-[#F04452]/10 p-6">
          <h4 className="text-xs font-bold text-[#F04452] tracking-wide uppercase mb-3">중복 구독 정리 추천</h4>
          <div className="space-y-2">
            {analysis.cancelCandidates.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-card/60">
                <div className="flex items-center gap-2.5">
                  <BrandIcon name={sub.name} icon={sub.icon} size="sm" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{sub.name}</div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {CATEGORY_LABELS[sub.category as SubscriptionCategory]} 카테고리 중복
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#F04452] tabular-nums">
                  {formatKRW(sub.monthlyPrice)}/월
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-card/80 rounded-xl text-center">
            <span className="text-xs text-muted-foreground font-medium">정리 시 예상 절약: </span>
            <span className="text-sm font-extrabold text-[#1FC08E]">
              월 {formatKRW(analysis.cancelCandidates.reduce((sum, s) => sum + s.monthlyPrice, 0))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
