'use client';

import { useMemo, useState } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useUsageStore } from '@/stores/usageStore';
import { formatKRW, formatKRWCompact } from '@/lib/utils/formatCurrency';
import {
  generateSavingsReport,
  generateInvestmentDataPoints,
  type SavingsReport as SavingsReportType,
  type SavingsItem,
  type InvestmentDataPoint,
} from '@/lib/calculations/savingsAnalysis';
import { BrandIcon } from '@/components/subscription/BrandIcon';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

// ── Action styling ─────────────────────────────────────────────────────
const ACTION_META: Record<
  SavingsItem['action'],
  { label: string; color: string; bg: string; icon: string }
> = {
  cancel: {
    label: '해지 추천',
    color: '#F04452',
    bg: 'rgba(240,68,82,0.08)',
    icon: '\u2716',
  },
  downgrade: {
    label: '다운그레이드',
    color: '#FFA826',
    bg: 'rgba(255,168,38,0.08)',
    icon: '\u2193',
  },
  share: {
    label: '패밀리 공유',
    color: '#3182F6',
    bg: 'rgba(49,130,246,0.08)',
    icon: '\uD83D\uDC65',
  },
  switch_plan: {
    label: '플랜 변경',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
    icon: '\uD83D\uDD04',
  },
  use_bundle: {
    label: '번들 할인',
    color: '#1FC08E',
    bg: 'rgba(31,192,142,0.08)',
    icon: '\uD83D\uDCE6',
  },
  use_discount: {
    label: '할인 적용',
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.08)',
    icon: '\uD83D\uDCB3',
  },
};

// ── Investment chart period ────────────────────────────────────────────
type ChartPeriod = '1Y' | '3Y' | '5Y';

const PERIOD_OPTIONS: { key: ChartPeriod; label: string; years: number }[] = [
  { key: '1Y', label: '1년', years: 1 },
  { key: '3Y', label: '3년', years: 3 },
  { key: '5Y', label: '5년', years: 5 },
];

// ── Custom Tooltip ─────────────────────────────────────────────────────
function InvestmentTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded-2xl border border-border bg-card p-4 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
      style={{ minWidth: 200 }}
    >
      <div className="text-xs font-bold text-muted-foreground mb-2">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-medium text-foreground">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-foreground tabular-nums">
            {formatKRW(Math.round(entry.value))}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────
export function SavingsReport() {
  const subscriptions = useSubscriptionStore((s) => s.subscriptions);
  const getActiveSubscriptions = useSubscriptionStore((s) => s.getActiveSubscriptions);
  const { generateROIAnalysis, usageRecords } = useUsageStore();

  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('5Y');

  const activeSubscriptions = useMemo(
    () => getActiveSubscriptions(),
    [subscriptions, getActiveSubscriptions],
  );

  const roiAnalyses = useMemo(
    () =>
      usageRecords.length > 0 ? generateROIAnalysis(subscriptions) : [],
    [subscriptions, usageRecords, generateROIAnalysis],
  );

  const report: SavingsReportType = useMemo(
    () => generateSavingsReport(subscriptions, roiAnalyses),
    [subscriptions, roiAnalyses],
  );

  const selectedPeriod = PERIOD_OPTIONS.find((p) => p.key === chartPeriod)!;

  const investmentData: InvestmentDataPoint[] = useMemo(
    () => generateInvestmentDataPoints(report.monthlySavings, selectedPeriod.years),
    [report.monthlySavings, selectedPeriod.years],
  );

  // 차트에 표시할 간격 결정 (너무 많은 포인트면 적절히 필터)
  const chartData = useMemo(() => {
    const totalPoints = investmentData.length;
    if (totalPoints <= 13) return investmentData;
    // 매 3개월씩 + 마지막 포인트
    return investmentData.filter(
      (_, idx) => idx === 0 || idx % 3 === 0 || idx === totalPoints - 1,
    );
  }, [investmentData]);

  if (activeSubscriptions.length === 0) {
    return null;
  }

  const hasAnySavings = report.monthlySavings > 0;

  return (
    <div className="space-y-6">
      {/* ── Header: 총 절약 가능 금액 ──────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="text-xs font-bold text-muted-foreground tracking-wide uppercase mb-4">
          AI 절약 분석 리포트
        </div>

        {hasAnySavings ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div>
              <div className="text-xs text-muted-foreground font-semibold mb-1">
                월간 절약 가능 금액
              </div>
              <div className="text-4xl font-extrabold tracking-tight" style={{ color: '#1FC08E' }}>
                {formatKRW(report.monthlySavings)}
              </div>
            </div>
            <div className="sm:ml-auto text-right">
              <div className="text-xs text-muted-foreground font-semibold mb-1">
                연간 절약 가능 금액
              </div>
              <div className="text-2xl font-extrabold tracking-tight" style={{ color: '#3182F6' }}>
                {formatKRW(report.yearlySavings)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-2xl font-extrabold text-foreground mb-2">
              잘 관리하고 계시네요!
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              현재 구독이 잘 최적화되어 있어 추가 절약 여지가 크지 않아요.
            </p>
          </div>
        )}

        {/* 보고서 요약 */}
        {hasAnySavings && (
          <div className="mt-4 p-4 rounded-xl bg-accent/50">
            <p className="text-sm text-foreground font-medium leading-relaxed">
              {report.reportSummary}
            </p>
          </div>
        )}
      </div>

      {/* ── 절약 항목 카드 ─────────────────────────────────────────────── */}
      {report.savingsBreakdown.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-foreground">
            절약 방법 {report.savingsBreakdown.length}건
          </h4>
          {report.savingsBreakdown.map((item, idx) => {
            const meta = ACTION_META[item.action];
            return (
              <div
                key={`${item.subscriptionName}-${item.action}-${idx}`}
                className="rounded-2xl border border-border bg-card p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-border/80 transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="shrink-0 mt-0.5">
                    <BrandIcon name={item.subscriptionName} icon={item.subscriptionIcon} size="sm" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-foreground truncate">
                        {item.subscriptionName}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ color: meta.color, backgroundColor: meta.bg }}
                      >
                        {meta.icon} {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground font-medium">
                        현재: <span className="font-bold text-foreground">{formatKRW(item.currentMonthlyPrice)}/월</span>
                      </span>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-muted-foreground font-medium">
                        {item.source}
                      </span>
                    </div>
                  </div>

                  {/* Savings */}
                  <div className="text-right shrink-0">
                    <div className="text-lg font-extrabold tabular-nums" style={{ color: '#1FC08E' }}>
                      -{formatKRW(item.savingsPerMonth)}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium">/월 절약</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 구매 대안 섹션 ─────────────────────────────────────────────── */}
      {report.purchaseAlternatives.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h4 className="text-sm font-bold text-foreground mb-1">
            연간 {formatKRW(report.yearlySavings)} 절약하면
          </h4>
          <p className="text-xs text-muted-foreground font-medium mb-4">
            아낀 돈으로 이런 것들을 할 수 있어요
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {report.purchaseAlternatives.map((alt) => (
              <div
                key={alt.name}
                className="rounded-xl bg-accent/40 p-3 text-center hover:bg-accent/60 transition-colors duration-200"
              >
                <div className="text-2xl mb-1">{alt.emoji}</div>
                <div className="text-xs font-bold text-foreground mb-0.5">
                  {alt.name}
                </div>
                <div className="text-lg font-extrabold tracking-tight" style={{ color: '#3182F6' }}>
                  {alt.count}
                  <span className="text-xs font-medium text-muted-foreground ml-0.5">
                    {alt.name.includes('항공권') || alt.name.includes('헬스장') ? '번' : '개'}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">
                  @{formatKRWCompact(alt.price)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 투자 시뮬레이션 ────────────────────────────────────────────── */}
      {hasAnySavings && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold text-foreground">투자 시뮬레이션</h4>
            {/* Period selector */}
            <div className="flex gap-1 bg-accent rounded-lg p-0.5" role="group" aria-label="투자 기간 선택">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setChartPeriod(opt.key)}
                  aria-pressed={chartPeriod === opt.key}
                  aria-label={`${opt.label} 기간`}
                  className={`text-xs font-bold px-3 py-1 rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    chartPeriod === opt.key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium mb-5">
            매월 {formatKRW(report.monthlySavings)}을 투자한다면
          </p>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gradKospi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3182F6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3182F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSp500" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1FC08E" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#1FC08E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFA826" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#FFA826" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="none"
                stroke="var(--color-border, hsl(var(--border)))"
                strokeOpacity={0.4}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--color-muted-foreground, #6b7280)', fontSize: 10, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'var(--color-muted-foreground, #6b7280)', fontSize: 10, fontWeight: 500 }}
                tickFormatter={(v) => formatKRWCompact(v)}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip content={<InvestmentTooltip />} />
              <Area
                type="monotone"
                dataKey="principal"
                name="원금"
                stroke="#94a3b8"
                fill="none"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="savings"
                name="적금 (3.5%)"
                stroke="#FFA826"
                fill="url(#gradSavings)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#FFA826', fill: 'var(--color-card, white)' }}
              />
              <Area
                type="monotone"
                dataKey="kospi"
                name="KOSPI200 (8.5%)"
                stroke="#3182F6"
                fill="url(#gradKospi)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#3182F6', fill: 'var(--color-card, white)' }}
              />
              <Area
                type="monotone"
                dataKey="sp500"
                name="S&P500 (10.5%)"
                stroke="#1FC08E"
                fill="url(#gradSp500)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#1FC08E', fill: 'var(--color-card, white)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                iconType="circle"
                iconSize={8}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <div className="rounded-xl bg-[#FFA826]/[0.06] p-3 text-center">
              <div className="text-[10px] font-bold text-[#FFA826] uppercase mb-1">
                적금 (연 3.5%)
              </div>
              <div className="text-sm font-extrabold text-foreground tabular-nums">
                {formatKRWCompact(
                  chartPeriod === '1Y'
                    ? report.investmentSimulation.savingsReturn1Y
                    : chartPeriod === '3Y'
                      ? report.investmentSimulation.savingsReturn3Y
                      : report.investmentSimulation.savingsReturn5Y,
                )}
              </div>
            </div>
            <div className="rounded-xl bg-[#3182F6]/[0.06] p-3 text-center">
              <div className="text-[10px] font-bold text-[#3182F6] uppercase mb-1">
                KOSPI200 (연 8.5%)
              </div>
              <div className="text-sm font-extrabold text-foreground tabular-nums">
                {formatKRWCompact(
                  chartPeriod === '1Y'
                    ? report.investmentSimulation.kospiReturn1Y
                    : chartPeriod === '3Y'
                      ? report.investmentSimulation.kospiReturn3Y
                      : report.investmentSimulation.kospiReturn5Y,
                )}
              </div>
            </div>
            <div className="rounded-xl bg-[#1FC08E]/[0.06] p-3 text-center">
              <div className="text-[10px] font-bold text-[#1FC08E] uppercase mb-1">
                S&P500 (연 10.5%)
              </div>
              <div className="text-sm font-extrabold text-foreground tabular-nums">
                {formatKRWCompact(
                  chartPeriod === '1Y'
                    ? report.investmentSimulation.sp500Return1Y
                    : chartPeriod === '3Y'
                      ? report.investmentSimulation.sp500Return3Y
                      : report.investmentSimulation.sp500Return5Y,
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 text-[10px] text-muted-foreground font-medium text-center">
            * 과거 수익률 기반 시뮬레이션이며 실제 수익을 보장하지 않습니다. 매월 초 적립 복리 기준.
          </div>
        </div>
      )}
    </div>
  );
}
