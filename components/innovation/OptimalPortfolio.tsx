'use client';

import { useMemo, useState, useCallback } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { CATEGORY_LABELS, CATEGORY_COLORS, type SubscriptionCategory } from '@/lib/types/subscription';
import { generateSavingsReport } from '@/lib/calculations/savingsAnalysis';
import { callLLM } from '@/lib/utils/llmApi';
import { Sparkles } from 'lucide-react';
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

// ── AI Portfolio Advice types ────────────────────────────────────────
interface AIRecommendation {
  name: string;
  action: 'keep' | 'cancel' | 'downgrade' | 'share' | 'switch';
  reason: string;
  monthlySaving: number;
}

interface AIPortfolioAdvice {
  summary: string;
  recommendations: AIRecommendation[];
  optimizedMonthly: number;
  keepValue: string;
}

const ACTION_STYLES: Record<AIRecommendation['action'], { label: string; color: string; bg: string }> = {
  keep: { label: '유지', color: '#1FC08E', bg: 'rgba(31,192,142,0.08)' },
  cancel: { label: '해지', color: '#F04452', bg: 'rgba(240,68,82,0.08)' },
  downgrade: { label: '다운그레이드', color: '#FFA826', bg: 'rgba(255,168,38,0.08)' },
  share: { label: '공유', color: '#3182F6', bg: 'rgba(49,130,246,0.08)' },
  switch: { label: '전환', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
};

function parseAIResponse(content: string): AIPortfolioAdvice | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

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

  // ── AI Analysis state ──────────────────────────────────────────────
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const parsedAIAdvice = useMemo<AIPortfolioAdvice | null>(() => {
    if (!aiAdvice) return null;
    return parseAIResponse(aiAdvice);
  }, [aiAdvice]);

  const handleAIAnalysis = useCallback(async () => {
    setIsLoadingAI(true);
    setAiError(null);
    setAiAdvice(null);

    const subscriptionData = activeSubscriptions.map((sub) => ({
      name: sub.name,
      category: CATEGORY_LABELS[sub.category],
      monthlyPrice: sub.monthlyPrice,
      isShared: sub.isShared,
      sharedCount: sub.sharedCount,
    }));

    const categoryRatios = analysis.diffs
      .filter((d) => d.currentPct > 0)
      .map((d) => ({
        category: d.label,
        currentPct: d.currentPct,
        recommendedPct: d.recommendedPct,
        spend: d.currentSpend,
      }));

    const systemMessage = `당신은 구독 관리 전문가입니다. 사용자의 구독 목록을 분석하여 가치 대비 최적의 구독 조합을 추천합니다.

핵심 원칙:
- 단순히 "다 끊으세요"는 절대 추천하지 마세요
- 사용자가 가치를 느끼는 구독은 유지를 추천하세요
- 중복되는 서비스(예: 넷플릭스+웨이브+쿠팡플레이)가 있으면 하나로 정리를 추천하세요
- 비용 대비 효용이 높은 구독은 "유지 추천"으로 명확히 말해주세요
- 패밀리 공유나 번들로 전환 가능하면 추천하세요
- 구체적인 금액과 이유를 포함하세요

응답 형식 (JSON만 출력, 다른 텍스트 없이):
{
  "summary": "한 줄 요약 (예: OTT를 정리하고 생산성 도구를 유지하면 월 15,000원을 절약하면서도 핵심 서비스를 유지할 수 있어요)",
  "recommendations": [
    {
      "name": "구독 이름",
      "action": "keep" | "cancel" | "downgrade" | "share" | "switch",
      "reason": "이유",
      "monthlySaving": 0
    }
  ],
  "optimizedMonthly": 총_최적화_후_월_비용_숫자,
  "keepValue": "유지하는 구독들이 제공하는 핵심 가치 설명"
}`;

    const userMessage = `내 구독 목록:
${JSON.stringify(subscriptionData, null, 2)}

카테고리별 비율:
${JSON.stringify(categoryRatios, null, 2)}

총 월 비용: ${formatKRW(totalCost)}

이 구독들을 분석해서 가치를 고려한 최적 조합을 추천해주세요.`;

    const result = await callLLM([
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ]);

    if (result.success) {
      setAiAdvice(result.content);
    } else {
      setAiError(result.error || '분석에 실패했습니다.');
    }

    setIsLoadingAI(false);
  }, [activeSubscriptions, analysis.diffs, totalCost]);

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

      {/* AI 맞춤 분석 */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI 맞춤 포트폴리오 분석
            </h4>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              AI가 가치를 고려한 최적의 구독 조합을 추천해드려요
            </p>
          </div>
          {!aiAdvice && !isLoadingAI && (
            <button
              onClick={handleAIAnalysis}
              disabled={isLoadingAI}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
            >
              AI 분석 받기
            </button>
          )}
        </div>

        {isLoadingAI && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="ml-3 text-sm text-muted-foreground font-medium">AI가 구독을 분석하고 있어요...</span>
          </div>
        )}

        {aiError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{aiError}</p>
            <button onClick={handleAIAnalysis} className="mt-2 text-xs font-bold text-primary">
              다시 시도
            </button>
          </div>
        )}

        {aiAdvice && !isLoadingAI && parsedAIAdvice && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="rounded-xl bg-primary/[0.04] border border-primary/10 p-4">
              <p className="text-sm font-semibold text-foreground">{parsedAIAdvice.summary}</p>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              {parsedAIAdvice.recommendations.map((rec, idx) => {
                const style = ACTION_STYLES[rec.action] || ACTION_STYLES.keep;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl border border-border"
                    style={{ backgroundColor: style.bg }}
                  >
                    <span
                      className="shrink-0 mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white"
                      style={{ backgroundColor: style.color }}
                    >
                      {style.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">{rec.name}</span>
                        {rec.monthlySaving > 0 && (
                          <span className="text-xs font-bold tabular-nums" style={{ color: '#1FC08E' }}>
                            -{formatKRW(rec.monthlySaving)}/월
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">{rec.reason}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cost Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-accent/40 p-3 text-center">
                <div className="text-[10px] text-muted-foreground font-semibold mb-0.5">현재 월 비용</div>
                <div className="text-lg font-extrabold text-foreground tabular-nums">{formatKRW(totalCost)}</div>
              </div>
              <div className="rounded-xl bg-[#1FC08E]/[0.06] p-3 text-center">
                <div className="text-[10px] text-[#1FC08E] font-semibold mb-0.5">AI 추천 월 비용</div>
                <div className="text-lg font-extrabold tabular-nums" style={{ color: '#1FC08E' }}>
                  {formatKRW(parsedAIAdvice.optimizedMonthly)}
                </div>
              </div>
            </div>

            {/* Keep Value */}
            <div className="rounded-xl bg-accent/30 p-4">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                유지하는 구독의 가치
              </div>
              <p className="text-sm font-medium text-foreground">{parsedAIAdvice.keepValue}</p>
            </div>

            {/* Reset button */}
            <div className="flex justify-end">
              <button
                onClick={handleAIAnalysis}
                className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                다시 분석하기
              </button>
            </div>
          </div>
        )}

        {/* Fallback: raw text if JSON parse fails */}
        {aiAdvice && !isLoadingAI && !parsedAIAdvice && (
          <div className="rounded-xl bg-accent/30 p-4">
            <p className="text-sm font-medium text-foreground whitespace-pre-wrap">{aiAdvice}</p>
            <div className="flex justify-end mt-3">
              <button
                onClick={handleAIAnalysis}
                className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                다시 분석하기
              </button>
            </div>
          </div>
        )}
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
