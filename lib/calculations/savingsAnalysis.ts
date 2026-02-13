import type { Subscription, SubscriptionCategory } from '@/lib/types/subscription';
import type { ROIAnalysis } from '@/lib/types/usage';
import { SERVICE_PRESETS, type ServicePreset } from '@/lib/constants/servicePresets';
import { analyzeBundleOptimization, type BundleOptimization } from './bundleOptimize';
import { findSharingOpportunities, type SharingOpportunity } from './sharingOptimize';
import { findMatchingEvents, type DiscountEvent } from '@/lib/constants/discountEvents';

// ── Types ──────────────────────────────────────────────────────────────

export interface SavingsReport {
  /** 월간 절약 가능 금액 */
  monthlySavings: number;
  /** 연간 절약 가능 금액 */
  yearlySavings: number;
  /** 절약 항목 상세 */
  savingsBreakdown: SavingsItem[];
  /** 아낀 돈으로 할 수 있는 것들 */
  purchaseAlternatives: PurchaseAlternative[];
  /** 투자 시뮬레이션 */
  investmentSimulation: InvestmentSimulation;
  /** 전체 보고서 텍스트 (규칙기반) */
  reportSummary: string;
}

export interface SavingsItem {
  subscriptionName: string;
  subscriptionIcon: string;
  currentMonthlyPrice: number;
  action: 'cancel' | 'downgrade' | 'share' | 'switch_plan' | 'use_bundle' | 'use_discount';
  savingsPerMonth: number;
  description: string;
  source: string;
}

export interface PurchaseAlternative {
  name: string;
  price: number;
  emoji: string;
  count: number;
}

export interface InvestmentSimulation {
  /** KOSPI200 ETF 기준 연평균 수익률 8.5% */
  kospiReturn1Y: number;
  kospiReturn3Y: number;
  kospiReturn5Y: number;
  /** S&P500 기준 연평균 수익률 10.5% */
  sp500Return1Y: number;
  sp500Return3Y: number;
  sp500Return5Y: number;
  /** 적금 기준 연 3.5% */
  savingsReturn1Y: number;
  savingsReturn3Y: number;
  savingsReturn5Y: number;
}

/** 투자 시뮬레이션 월별 데이터 포인트 */
export interface InvestmentDataPoint {
  month: number;
  label: string;
  kospi: number;
  sp500: number;
  savings: number;
  principal: number;
}

// ── Constants ──────────────────────────────────────────────────────────

/** 연평균 수익률 상수 */
const KOSPI_ANNUAL_RATE = 0.085;
const SP500_ANNUAL_RATE = 0.105;
const SAVINGS_ANNUAL_RATE = 0.035;

/** 구매 대안 목록 (한국 기준 가격) */
const PURCHASE_ALTERNATIVES_CATALOG: Omit<PurchaseAlternative, 'count'>[] = [
  { name: '스타벅스 아메리카노', price: 5000, emoji: '\u2615' },
  { name: '맥도날드 빅맥세트', price: 7500, emoji: '\uD83C\uDF54' },
  { name: 'CGV 영화 관람', price: 15000, emoji: '\uD83C\uDFAC' },
  { name: '베스트셀러 책', price: 18000, emoji: '\uD83D\uDCDA' },
  { name: '피자 한 판', price: 25000, emoji: '\uD83C\uDF55' },
  { name: '헬스장 1개월', price: 80000, emoji: '\uD83C\uDFCB\uFE0F' },
  { name: '제주도 왕복 항공권', price: 100000, emoji: '\u2708\uFE0F' },
  { name: '에어팟 프로', price: 359000, emoji: '\uD83C\uDFA7' },
  { name: '아이폰 16', price: 1250000, emoji: '\uD83D\uDCF1' },
  { name: '맥북 에어 M4', price: 1790000, emoji: '\uD83D\uDCBB' },
];

// ── Investment Calculation (정밀 복리 계산) ─────────────────────────────

/**
 * 매월 일정액을 적립하며 복리 수익을 계산합니다.
 * 월 수익률 = (1 + 연수익률)^(1/12) - 1
 * FV = monthlyAmount * Sigma_{i=0}^{n-1} (1 + monthlyRate)^(n-i)
 *
 * 정밀도를 위해 부동소수점 오차를 최소화하는 방식으로 계산합니다.
 */
function calculateCompoundReturn(
  monthlyAmount: number,
  annualRate: number,
  years: number,
): number {
  const months = years * 12;
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;

  let total = 0;
  for (let i = 0; i < months; i++) {
    // 매월 초에 투자한다고 가정, i개월 후 기준으로 (months - i)개월 동안 복리
    total += monthlyAmount * Math.pow(1 + monthlyRate, months - i);
  }

  // 소수점 이하 원 단위까지 정밀하게 계산 후 반올림
  return Math.round(total * 100) / 100;
}

/**
 * 월별 누적 수익 데이터 포인트를 생성합니다.
 */
export function generateInvestmentDataPoints(
  monthlyAmount: number,
  years: number,
): InvestmentDataPoint[] {
  const totalMonths = years * 12;
  const kospiMonthlyRate = Math.pow(1 + KOSPI_ANNUAL_RATE, 1 / 12) - 1;
  const sp500MonthlyRate = Math.pow(1 + SP500_ANNUAL_RATE, 1 / 12) - 1;
  const savingsMonthlyRate = Math.pow(1 + SAVINGS_ANNUAL_RATE, 1 / 12) - 1;

  const points: InvestmentDataPoint[] = [];

  // 0개월 (시작점)
  points.push({
    month: 0,
    label: '시작',
    kospi: 0,
    sp500: 0,
    savings: 0,
    principal: 0,
  });

  // 매월 적립 누적 계산
  let kospiTotal = 0;
  let sp500Total = 0;
  let savingsTotal = 0;

  for (let m = 1; m <= totalMonths; m++) {
    // 기존 잔액에 이자 적용 후 신규 적립금 추가
    kospiTotal = (kospiTotal + monthlyAmount) * (1 + kospiMonthlyRate);
    sp500Total = (sp500Total + monthlyAmount) * (1 + sp500MonthlyRate);
    savingsTotal = (savingsTotal + monthlyAmount) * (1 + savingsMonthlyRate);

    const principal = monthlyAmount * m;

    points.push({
      month: m,
      label: m % 12 === 0 ? `${m / 12}년` : `${m}개월`,
      kospi: Math.round(kospiTotal * 100) / 100,
      sp500: Math.round(sp500Total * 100) / 100,
      savings: Math.round(savingsTotal * 100) / 100,
      principal: Math.round(principal * 100) / 100,
    });
  }

  return points;
}

// ── Analysis Logic ─────────────────────────────────────────────────────

/**
 * 번들 할인 분석
 * 동일 카테고리 구독이 2개 이상이면 번들로 전환 가능 여부 체크
 */
function analyzeBundleSavings(subscriptions: Subscription[]): SavingsItem[] {
  const items: SavingsItem[] = [];
  const bundleOptimizations = analyzeBundleOptimization(subscriptions);

  for (const opt of bundleOptimizations) {
    if (opt.monthlySavings <= 0) continue;

    // 번들에 매칭된 각 구독에 대해 절약 항목 생성
    // 절약액을 매칭된 구독 수로 균등 분배하지 않고, 전체 절약액을 번들 단위로 표시
    const matchedNames = opt.matchedSubscriptions.map((s) => s.name).join(' + ');
    const primarySub = opt.matchedSubscriptions[0];

    items.push({
      subscriptionName: matchedNames,
      subscriptionIcon: opt.bundle.icon || primarySub.icon,
      currentMonthlyPrice: opt.currentTotalCost,
      action: 'use_bundle',
      savingsPerMonth: opt.monthlySavings,
      description: `${opt.bundle.name}(${opt.bundle.price.toLocaleString()}원/월)으로 통합하면 절약할 수 있어요`,
      source: `번들 할인 (${opt.bundle.provider})`,
    });
  }

  return items;
}

/**
 * 카드 할인 분석
 * discountEvents.ts에서 활성 할인 매칭
 */
function analyzeDiscountSavings(subscriptions: Subscription[]): SavingsItem[] {
  const items: SavingsItem[] = [];
  const active = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'trial',
  );
  const serviceNames = active.map((s) => s.name);
  const events = findMatchingEvents(serviceNames);

  // 카드/통신사/프로모션 할인만 선택
  const discountEvents = events.filter(
    (e) => e.type === 'card' || e.type === 'telecom' || e.type === 'promotion',
  );

  // 구독당 최고 할인 1개만 유지 (카드/통신사/프로모션 중 최대 절약)
  const bestBySubId = new Map<string, SavingsItem>();

  for (const event of discountEvents) {
    for (const sub of active) {
      const matches = event.targetServices.some(
        (target) => sub.name.includes(target) || target.includes(sub.name),
      );

      if (!matches) continue;

      let savingsPerMonth = 0;

      if (event.discountAmount) {
        savingsPerMonth = event.discountAmount;
      } else if (event.discountPercent) {
        savingsPerMonth = Math.round((sub.monthlyPrice * event.discountPercent) / 100 * 100) / 100;
      }

      // 절약액이 구독료를 초과하지 않도록 제한
      savingsPerMonth = Math.min(savingsPerMonth, sub.monthlyPrice);

      if (savingsPerMonth > 0) {
        const existing = bestBySubId.get(sub.id);
        if (!existing || savingsPerMonth > existing.savingsPerMonth) {
          const typeLabel =
            event.type === 'card' ? '카드 할인' :
            event.type === 'telecom' ? '통신사 혜택' : '프로모션';

          bestBySubId.set(sub.id, {
            subscriptionName: sub.name,
            subscriptionIcon: sub.icon,
            currentMonthlyPrice: sub.monthlyPrice,
            action: 'use_discount',
            savingsPerMonth,
            description: `${event.title}: ${event.description}`,
            source: `${typeLabel} (${event.provider})`,
          });
        }
      }
    }
  }

  return Array.from(bestBySubId.values());
}

/**
 * 패밀리 공유 분석
 * isShared가 false이고 familyPlan이 있는 경우 공유 시 절약액
 */
function analyzeFamilySharingSavings(subscriptions: Subscription[]): SavingsItem[] {
  const items: SavingsItem[] = [];
  const opportunities = findSharingOpportunities(subscriptions);

  for (const opp of opportunities) {
    items.push({
      subscriptionName: opp.subscription.name,
      subscriptionIcon: opp.subscription.icon,
      currentMonthlyPrice: opp.individualPrice,
      action: 'share',
      savingsPerMonth: opp.savingsPerPerson,
      description: `${opp.familyPlanName} 플랜을 ${opp.maxMembers}인과 공유하면 인당 ${Math.ceil(opp.familyPlanPrice / opp.maxMembers).toLocaleString()}원`,
      source: '패밀리 공유',
    });
  }

  return items;
}

/**
 * 해지 추천 분석 (ROI 기반)
 * Grade D 또는 F인 구독은 해지 추천
 */
function analyzeCancellationSavings(
  subscriptions: Subscription[],
  roiAnalyses: ROIAnalysis[],
): SavingsItem[] {
  const items: SavingsItem[] = [];

  for (const analysis of roiAnalyses) {
    if (analysis.recommendation !== 'cancel') continue;

    const sub = subscriptions.find((s) => s.id === analysis.subscriptionId);
    if (!sub) continue;

    items.push({
      subscriptionName: sub.name,
      subscriptionIcon: sub.icon,
      currentMonthlyPrice: sub.monthlyPrice,
      action: 'cancel',
      savingsPerMonth: sub.monthlyPrice,
      description: analysis.recommendationReason,
      source: `ROI 분석 (등급 ${analysis.grade})`,
    });
  }

  return items;
}

/**
 * 요금제 다운그레이드 분석
 * ROI Grade C이고 더 저렴한 요금제가 있는 경우
 */
function analyzeDowngradeSavings(
  subscriptions: Subscription[],
  roiAnalyses: ROIAnalysis[],
): SavingsItem[] {
  const items: SavingsItem[] = [];

  for (const analysis of roiAnalyses) {
    if (analysis.recommendation !== 'downgrade') continue;

    const sub = subscriptions.find((s) => s.id === analysis.subscriptionId);
    if (!sub) continue;

    const preset = SERVICE_PRESETS[sub.name];
    if (!preset || preset.plans.length <= 1) continue;

    // 현재 요금보다 저렴한 플랜 찾기
    const cheaperPlans = preset.plans
      .filter((p) => {
        const planMonthly = p.cycle === 'yearly' ? Math.round(p.price / 12) : p.price;
        return planMonthly < sub.monthlyPrice;
      })
      .sort((a, b) => {
        const aMonthly = a.cycle === 'yearly' ? Math.round(a.price / 12) : a.price;
        const bMonthly = b.cycle === 'yearly' ? Math.round(b.price / 12) : b.price;
        return bMonthly - aMonthly; // 가장 비싼 하위 플랜 우선
      });

    if (cheaperPlans.length > 0) {
      const targetPlan = cheaperPlans[0];
      const targetMonthly =
        targetPlan.cycle === 'yearly'
          ? Math.round(targetPlan.price / 12)
          : targetPlan.price;
      const savings = sub.monthlyPrice - targetMonthly;

      items.push({
        subscriptionName: sub.name,
        subscriptionIcon: sub.icon,
        currentMonthlyPrice: sub.monthlyPrice,
        action: 'downgrade',
        savingsPerMonth: savings,
        description: `${targetPlan.name} 요금제(${targetMonthly.toLocaleString()}원/월)로 변경 추천`,
        source: '요금제 다운그레이드',
      });
    }
  }

  return items;
}

// ── Deduplication ──────────────────────────────────────────────────────

/**
 * 하나의 구독 = 하나의 최적 절약 방법만 남깁니다.
 * 번들이 같은 구독을 클레임하면 절약이 큰 번들 우선.
 * 번들에 포함된 구독은 개별 항목에서 제거.
 * 총 절약 ≤ 총 구독비 보장.
 */
function deduplicateSavingsItems(
  items: SavingsItem[],
  activeSubscriptions: Subscription[],
): SavingsItem[] {
  const bundleItems = items.filter((item) => item.action === 'use_bundle');
  const nonBundleItems = items.filter((item) => item.action !== 'use_bundle');

  // 번들에 클레임된 구독 이름 추적
  const claimedByBundle = new Set<string>();

  // 번들 간 중복 해소: 같은 구독을 포함하는 번들이 여러 개면 절약이 큰 것 우선
  const sortedBundles = [...bundleItems].sort(
    (a, b) => b.savingsPerMonth - a.savingsPerMonth,
  );
  const selectedBundles: SavingsItem[] = [];

  for (const bundle of sortedBundles) {
    // 번들에 포함된 개별 구독 이름 추출 (" + " split)
    const bundleSubNames = bundle.subscriptionName
      .split(' + ')
      .map((n) => n.trim());

    // 이미 다른 번들에 클레임된 구독이 있는지 확인
    const hasConflict = bundleSubNames.some((name) => claimedByBundle.has(name));
    if (hasConflict) continue;

    // 이 번들 선택
    selectedBundles.push(bundle);
    for (const name of bundleSubNames) {
      claimedByBundle.add(name);
    }
  }

  // 비번들 항목: 동일 구독명 → 최고 절약 1개, 번들에 포함된 구독 제외
  const bestByName = new Map<string, SavingsItem>();

  for (const item of nonBundleItems) {
    if (claimedByBundle.has(item.subscriptionName)) continue;

    const existing = bestByName.get(item.subscriptionName);
    if (!existing || item.savingsPerMonth > existing.savingsPerMonth) {
      bestByName.set(item.subscriptionName, item);
    }
  }

  // 각 항목의 절약액이 해당 구독의 monthlyPrice를 초과하지 않도록 보장
  const allSelected = [...selectedBundles, ...Array.from(bestByName.values())];
  for (const item of allSelected) {
    item.savingsPerMonth = Math.min(item.savingsPerMonth, item.currentMonthlyPrice);
  }

  // 글로벌 캡: 총 절약 ≤ 총 월 구독비
  const totalMonthlySpend = activeSubscriptions.reduce(
    (sum, s) => sum + s.monthlyPrice,
    0,
  );
  const totalSavings = allSelected.reduce(
    (sum, item) => sum + item.savingsPerMonth,
    0,
  );

  if (totalSavings > totalMonthlySpend && totalSavings > 0) {
    // 비례 축소
    const ratio = totalMonthlySpend / totalSavings;
    for (const item of allSelected) {
      item.savingsPerMonth = Math.round(item.savingsPerMonth * ratio);
    }
  }

  return allSelected.sort((a, b) => b.savingsPerMonth - a.savingsPerMonth);
}

// ── Purchase Alternatives ──────────────────────────────────────────────

function computePurchaseAlternatives(yearlySavings: number): PurchaseAlternative[] {
  if (yearlySavings <= 0) return [];

  return PURCHASE_ALTERNATIVES_CATALOG
    .map((item) => ({
      ...item,
      count: Math.floor(yearlySavings / item.price),
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

// ── Investment Simulation ──────────────────────────────────────────────

function computeInvestmentSimulation(monthlySavings: number): InvestmentSimulation {
  return {
    kospiReturn1Y: calculateCompoundReturn(monthlySavings, KOSPI_ANNUAL_RATE, 1),
    kospiReturn3Y: calculateCompoundReturn(monthlySavings, KOSPI_ANNUAL_RATE, 3),
    kospiReturn5Y: calculateCompoundReturn(monthlySavings, KOSPI_ANNUAL_RATE, 5),

    sp500Return1Y: calculateCompoundReturn(monthlySavings, SP500_ANNUAL_RATE, 1),
    sp500Return3Y: calculateCompoundReturn(monthlySavings, SP500_ANNUAL_RATE, 3),
    sp500Return5Y: calculateCompoundReturn(monthlySavings, SP500_ANNUAL_RATE, 5),

    savingsReturn1Y: calculateCompoundReturn(monthlySavings, SAVINGS_ANNUAL_RATE, 1),
    savingsReturn3Y: calculateCompoundReturn(monthlySavings, SAVINGS_ANNUAL_RATE, 3),
    savingsReturn5Y: calculateCompoundReturn(monthlySavings, SAVINGS_ANNUAL_RATE, 5),
  };
}

// ── Report Summary (규칙기반) ──────────────────────────────────────────

function generateReportSummary(
  monthlySavings: number,
  yearlySavings: number,
  items: SavingsItem[],
  investmentSim: InvestmentSimulation,
): string {
  if (items.length === 0) {
    return '현재 구독 포트폴리오가 잘 최적화되어 있어요! 추가 절약 여지가 크지 않습니다.';
  }

  const parts: string[] = [];

  // 총 절약액
  parts.push(
    `분석 결과, 월 ${monthlySavings.toLocaleString()}원(연 ${yearlySavings.toLocaleString()}원)을 절약할 수 있는 ${items.length}가지 방법을 찾았어요.`,
  );

  // 주요 절약 방법 요약
  const cancelItems = items.filter((i) => i.action === 'cancel');
  const shareItems = items.filter((i) => i.action === 'share');
  const bundleItems = items.filter((i) => i.action === 'use_bundle');
  const discountItems = items.filter((i) => i.action === 'use_discount');
  const downgradeItems = items.filter((i) => i.action === 'downgrade');

  if (cancelItems.length > 0) {
    const cancelTotal = cancelItems.reduce((s, i) => s + i.savingsPerMonth, 0);
    parts.push(
      `사용량이 적은 구독 ${cancelItems.length}건을 해지하면 월 ${cancelTotal.toLocaleString()}원을 절약할 수 있어요.`,
    );
  }

  if (shareItems.length > 0) {
    const shareTotal = shareItems.reduce((s, i) => s + i.savingsPerMonth, 0);
    parts.push(
      `패밀리 공유를 활용하면 ${shareItems.length}건에서 월 ${shareTotal.toLocaleString()}원을 줄일 수 있어요.`,
    );
  }

  if (bundleItems.length > 0) {
    const bundleTotal = bundleItems.reduce((s, i) => s + i.savingsPerMonth, 0);
    parts.push(
      `번들 상품으로 통합하면 월 ${bundleTotal.toLocaleString()}원을 절약할 수 있어요.`,
    );
  }

  if (discountItems.length > 0) {
    const discountTotal = discountItems.reduce((s, i) => s + i.savingsPerMonth, 0);
    parts.push(
      `카드/통신사 할인을 활용하면 월 ${discountTotal.toLocaleString()}원을 추가로 줄일 수 있어요.`,
    );
  }

  if (downgradeItems.length > 0) {
    parts.push(
      `요금제를 다운그레이드할 수 있는 구독이 ${downgradeItems.length}건 있어요.`,
    );
  }

  // 투자 시뮬레이션 요약
  if (monthlySavings > 0) {
    parts.push(
      `절약한 금액을 5년간 투자하면 KOSPI 기준 약 ${Math.round(investmentSim.kospiReturn5Y).toLocaleString()}원, S&P500 기준 약 ${Math.round(investmentSim.sp500Return5Y).toLocaleString()}원이 될 수 있어요.`,
    );
  }

  return parts.join(' ');
}

// ── Main Entry Point ───────────────────────────────────────────────────

/**
 * 구독 목록과 ROI 분석 결과를 기반으로 종합 절약 보고서를 생성합니다.
 *
 * @param subscriptions - 전체 구독 목록
 * @param roiAnalyses - ROI 분석 결과 (사용량 데이터가 없으면 빈 배열)
 * @returns SavingsReport
 */
export function generateSavingsReport(
  subscriptions: Subscription[],
  roiAnalyses: ROIAnalysis[] = [],
): SavingsReport {
  const active = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'trial',
  );

  if (active.length === 0) {
    return {
      monthlySavings: 0,
      yearlySavings: 0,
      savingsBreakdown: [],
      purchaseAlternatives: [],
      investmentSimulation: computeInvestmentSimulation(0),
      reportSummary: '활성 구독이 없어 분석할 내용이 없습니다.',
    };
  }

  // 1. 각 분석 로직 실행
  const bundleItems = analyzeBundleSavings(active);
  const discountItems = analyzeDiscountSavings(active);
  const familyItems = analyzeFamilySharingSavings(active);
  const cancelItems = analyzeCancellationSavings(active, roiAnalyses);
  const downgradeItems = analyzeDowngradeSavings(active, roiAnalyses);

  // 2. 모든 절약 항목 취합 및 중복 제거
  const allItems = [
    ...bundleItems,
    ...discountItems,
    ...familyItems,
    ...cancelItems,
    ...downgradeItems,
  ];
  const dedupedItems = deduplicateSavingsItems(allItems, active);

  // 3. 총 절약액 계산 (정밀 합산)
  const monthlySavings = dedupedItems.reduce(
    (sum, item) => sum + item.savingsPerMonth,
    0,
  );
  // 연간 절약액: 월 절약액 * 12 (단순 곱)
  const yearlySavings = Math.round(monthlySavings * 12 * 100) / 100;

  // 4. 구매 대안 계산
  const purchaseAlternatives = computePurchaseAlternatives(yearlySavings);

  // 5. 투자 시뮬레이션
  const investmentSimulation = computeInvestmentSimulation(monthlySavings);

  // 6. 보고서 요약 생성
  const reportSummary = generateReportSummary(
    monthlySavings,
    yearlySavings,
    dedupedItems,
    investmentSimulation,
  );

  return {
    monthlySavings: Math.round(monthlySavings * 100) / 100,
    yearlySavings,
    savingsBreakdown: dedupedItems,
    purchaseAlternatives,
    investmentSimulation,
    reportSummary,
  };
}

// ── Utility exports for detailed analysis ──────────────────────────────

export {
  KOSPI_ANNUAL_RATE,
  SP500_ANNUAL_RATE,
  SAVINGS_ANNUAL_RATE,
  calculateCompoundReturn,
};
