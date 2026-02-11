'use client';

import { useMemo } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { CATEGORY_LABELS, CATEGORY_COLORS, type SubscriptionCategory } from '@/lib/types/subscription';
import { generateSavingsReport } from '@/lib/calculations/savingsAnalysis';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

// ── Recommended allocation (Korean average) ────────────────────────────
const RECOMMENDED_RATIO: Record<SubscriptionCategory, number> = {
  video: 35,
  music: 15,
  productivity: 20,
  cloud: 10,
  shopping: 10,
  gaming: 0,
  reading: 0,
  other: 10,
};

// Friendly category name for display in radar
const RADAR_LABELS: Record<SubscriptionCategory, string> = {
  video: 'OTT',
  music: '음악',
  productivity: '생산성',
  cloud: '클라우드',
  shopping: '쇼핑',
  gaming: '게임',
  reading: '독서',
  other: '기타',
};

// ── Advice generator ───────────────────────────────────────────────────
interface CategoryDiff {
  category: SubscriptionCategory;
  label: string;
  currentPct: number;
  recommendedPct: number;
  diff: number;       // positive = user is over
  currentSpend: number;
  color: string;
}

function generateAdvice(diffs: CategoryDiff[]): string[] {
  const advice: string[] = [];

  // Sort by absolute diff descending
  const sorted = [...diffs].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  for (const d of sorted) {
    if (Math.abs(d.diff) < 5) continue; // skip small differences

    if (d.diff > 15) {
      advice.push(
        `${d.label} 비중이 ${Math.round(d.diff)}%p 높아요. 하나를 정리하면 균형잡힌 구독이 돼요.`,
      );
    } else if (d.diff > 5) {
      advice.push(
        `${d.label} 비중이 조금 높은 편이에요. 대안 서비스를 비교해보세요.`,
      );
    } else if (d.diff < -15) {
      advice.push(
        `${d.label} 비중이 ${Math.round(Math.abs(d.diff))}%p 낮아요. 필요하다면 추가를 고려해보세요.`,
      );
    } else if (d.diff < -5) {
      advice.push(
        `${d.label}을 조금 더 활용하면 디지털 라이프가 풍부해질 수 있어요.`,
      );
    }

    if (advice.length >= 3) break;
  }

  if (advice.length === 0) {
    advice.push('카테고리 비율이 추천 비율과 비슷해요. 잘 관리하고 계시네요!');
  }

  return advice;
}

// ── Component ──────────────────────────────────────────────────────────
export function OptimalPortfolio() {
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const getActiveSubscriptions = useSubscriptionStore((s) => s.getActiveSubscriptions);
  const getTotalMonthlyCost = useSubscriptionStore((s) => s.getTotalMonthlyCost);

  const activeSubscriptions = useMemo(() => getActiveSubscriptions(), [subscriptions, getActiveSubscriptions]);
  const totalCost = useMemo(() => getTotalMonthlyCost(), [subscriptions, getTotalMonthlyCost]);

  const analysis = useMemo(() => {
    // Calculate current percentage by category (spend-based)
    const spendByCategory: Record<SubscriptionCategory, number> = {
      video: 0,
      music: 0,
      cloud: 0,
      productivity: 0,
      shopping: 0,
      gaming: 0,
      reading: 0,
      other: 0,
    };

    for (const sub of activeSubscriptions) {
      spendByCategory[sub.category] += sub.monthlyPrice;
    }

    const categories: SubscriptionCategory[] = [
      'video', 'music', 'productivity', 'cloud', 'shopping', 'gaming', 'reading', 'other',
    ];

    const diffs: CategoryDiff[] = categories.map((cat) => {
      const currentPct = totalCost > 0 ? (spendByCategory[cat] / totalCost) * 100 : 0;
      const recommendedPct = RECOMMENDED_RATIO[cat];
      return {
        category: cat,
        label: RADAR_LABELS[cat],
        currentPct: Math.round(currentPct * 10) / 10,
        recommendedPct,
        diff: Math.round((currentPct - recommendedPct) * 10) / 10,
        currentSpend: spendByCategory[cat],
        color: CATEGORY_COLORS[cat],
      };
    });

    // Radar chart data
    const radarData = categories.map((cat) => ({
      subject: RADAR_LABELS[cat],
      current: totalCost > 0 ? Math.round((spendByCategory[cat] / totalCost) * 100) : 0,
      recommended: RECOMMENDED_RATIO[cat],
    }));

    const adviceList = generateAdvice(diffs);

    // Overall balance score (0–100): 100 = perfect match
    const totalDiffAbs = diffs.reduce((sum, d) => sum + Math.abs(d.diff), 0);
    const balanceScore = Math.max(0, Math.round(100 - totalDiffAbs));

    // Savings analysis for portfolio comparison
    const savingsReport = generateSavingsReport(activeSubscriptions);
    const currentYearlyCost = totalCost * 12;
    const optimizedYearlyCost = Math.max(0, currentYearlyCost - savingsReport.yearlySavings);
    const optimizedMonthlyCost = Math.round(optimizedYearlyCost / 12);

    return {
      diffs,
      radarData,
      adviceList,
      balanceScore,
      savingsReport,
      currentYearlyCost,
      optimizedYearlyCost,
      optimizedMonthlyCost,
    };
  }, [activeSubscriptions, totalCost]);

  if (activeSubscriptions.length === 0) {
    return null;
  }

  const scoreColor =
    analysis.balanceScore >= 70
      ? '#1FC08E'
      : analysis.balanceScore >= 40
        ? '#FFA826'
        : '#F04452';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-extrabold text-foreground mb-1">최적 포트폴리오</h3>
        <p className="text-sm text-muted-foreground font-medium">카테고리 비율을 한국 평균과 비교해보세요</p>
      </div>

      {/* Balance Score + Radar Chart */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Score Card */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center">
          <div className="text-xs font-bold text-muted-foreground tracking-wide uppercase mb-4">균형 점수</div>
          <div className="relative w-32 h-32 mb-4">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="var(--color-muted, hsl(var(--muted)))"
                strokeWidth="10"
                strokeOpacity="0.3"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={scoreColor}
                strokeWidth="10"
                strokeDasharray={`${(analysis.balanceScore / 100) * 314} 314`}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-extrabold tracking-tight" style={{ color: scoreColor }}>
                {analysis.balanceScore}
              </span>
            </div>
          </div>
          <div className="text-sm font-bold text-foreground mb-1">
            {analysis.balanceScore >= 70
              ? '균형잡힌 구독이에요!'
              : analysis.balanceScore >= 40
                ? '조금 편중된 구독이에요'
                : '개선이 필요해요'}
          </div>
          <div className="text-xs text-muted-foreground font-medium text-center">
            100에 가까울수록 추천 비율과 유사해요
          </div>
        </div>

        {/* Radar Chart */}
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6">
          <h4 className="text-sm font-bold text-foreground mb-4">현재 vs 추천 비율</h4>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={analysis.radarData}>
              <PolarGrid
                stroke="var(--color-border, hsl(var(--border)))"
                strokeOpacity={0.6}
              />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'var(--color-muted-foreground, #6b7280)', fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 'auto']}
                tick={{ fill: 'var(--color-muted-foreground, #6b7280)', fontSize: 10 }}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Radar
                name="추천 비율"
                dataKey="recommended"
                stroke="#94a3b8"
                fill="#94a3b8"
                fillOpacity={0.08}
                strokeWidth={2}
                strokeDasharray="6 3"
              />
              <Radar
                name="내 비율"
                dataKey="current"
                stroke="#3182F6"
                fill="#3182F6"
                fillOpacity={0.15}
                strokeWidth={2.5}
                dot={{ fill: '#3182F6', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#3182F6', fill: 'var(--color-card, white)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', fontWeight: 600 }}
                iconType="circle"
                iconSize={8}
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
                formatter={(value) => `${value}%`}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Advice Cards */}
      <div className="rounded-2xl bg-primary/[0.04] border border-primary/10 p-6">
        <h4 className="text-xs font-bold text-primary tracking-wide uppercase mb-3">맞춤 조언</h4>
        <div className="space-y-2.5">
          {analysis.adviceList.map((advice, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
              <p className="text-sm font-medium text-foreground">{advice}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Annual Cost Comparison: Current vs Optimized */}
      {analysis.savingsReport.monthlySavings > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <h4 className="text-sm font-bold text-foreground mb-4">현재 vs 최적화 포트폴리오</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl bg-accent/40 p-4 text-center">
              <div className="text-xs text-muted-foreground font-semibold mb-1">현재 연간 비용</div>
              <div className="text-2xl font-extrabold text-foreground tabular-nums">
                {formatKRW(analysis.currentYearlyCost)}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">
                월 {formatKRW(totalCost)}
              </div>
            </div>
            <div className="rounded-xl bg-[#1FC08E]/[0.06] p-4 text-center">
              <div className="text-xs text-[#1FC08E] font-semibold mb-1">최적화 시 연간 비용</div>
              <div className="text-2xl font-extrabold tabular-nums" style={{ color: '#1FC08E' }}>
                {formatKRW(analysis.optimizedYearlyCost)}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">
                월 {formatKRW(analysis.optimizedMonthlyCost)}
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-primary/[0.04] p-3 text-center">
            <span className="text-xs text-muted-foreground font-medium">절약 시 투자 수익 (5년, S&P500 기준): </span>
            <span className="text-sm font-extrabold" style={{ color: '#1FC08E' }}>
              {formatKRW(Math.round(analysis.savingsReport.investmentSimulation.sp500Return5Y))}
            </span>
          </div>
        </div>
      )}

      {/* Category Breakdown Table */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h4 className="text-sm font-bold text-foreground mb-4">카테고리별 비교</h4>
        <div className="space-y-3">
          {analysis.diffs
            .filter((d) => d.currentPct > 0 || d.recommendedPct > 0)
            .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
            .map((d) => {
              const diffColor =
                Math.abs(d.diff) < 5
                  ? '#1FC08E'
                  : d.diff > 0
                    ? '#F04452'
                    : '#FFA826';

              return (
                <div
                  key={d.category}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent/50 transition-colors duration-200"
                >
                  {/* Color dot + label */}
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-sm font-semibold text-foreground">{d.label}</span>
                  </div>

                  {/* Bar visualization */}
                  <div className="flex-1">
                    <div className="flex gap-1 mb-1">
                      {/* Current */}
                      <div className="flex-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${Math.min(d.currentPct, 100)}%`,
                              backgroundColor: '#3182F6',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {/* Recommended */}
                      <div className="flex-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out opacity-40"
                            style={{
                              width: `${Math.min(d.recommendedPct, 100)}%`,
                              backgroundColor: '#94a3b8',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Numbers */}
                  <div className="text-right min-w-[120px]">
                    <div className="flex items-center justify-end gap-2 text-xs">
                      <span className="font-bold text-foreground tabular-nums">{d.currentPct}%</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="font-medium text-muted-foreground tabular-nums">{d.recommendedPct}%</span>
                    </div>
                    <div className="text-[10px] font-bold tabular-nums mt-0.5" style={{ color: diffColor }}>
                      {d.diff > 0 ? '+' : ''}{d.diff}%p
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-[#3182F6]" />
            <span className="text-[11px] text-muted-foreground font-medium">내 비율</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-[#94a3b8] opacity-40" />
            <span className="text-[11px] text-muted-foreground font-medium">추천 비율</span>
          </div>
        </div>
      </div>
    </div>
  );
}
