import type { Subscription } from '@/lib/types/subscription';
import { BUNDLE_DEALS, type BundleDeal } from '@/lib/constants/bundleDeals';

export interface BundleOptimization {
  bundle: BundleDeal;
  matchedSubscriptions: Subscription[];
  currentTotalCost: number;
  bundleCost: number;
  monthlySavings: number;
  explanation: string;
  /** 'savings' = 실질 절약 가능, 'info' = 참고 정보 (조건부 혜택/관련 번들) */
  type: 'savings' | 'info';
}

/**
 * Analyze which bundles could save money or are relevant for the user.
 *
 * 3가지 추천 유형:
 * 1. savings: 비조건부 번들이 현재 구독비보다 저렴 → 실질 절약
 * 2. info (conditional): 통신사 조건부 혜택 + 2개 이상 구독 매칭 → 참고 정보
 * 3. info (relevant): 비조건부 번들 + 2개 이상 매칭이지만 더 비쌈 → 참고 정보
 *
 * 이미 해당 번들을 사용 중이면 추천하지 않음.
 */
export function analyzeBundleOptimization(
  subscriptions: Subscription[],
): BundleOptimization[] {
  const active = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'trial',
  );

  const results: BundleOptimization[] = [];

  for (const bundle of BUNDLE_DEALS) {
    const matched = findMatchingSubscriptions(active, bundle);
    if (matched.length === 0) continue;

    // 이미 이 번들을 사용 중인지 감지 (구독 이름이 번들 이름과 일치)
    const alreadyUsing = active.some(
      (sub) =>
        normalizeServiceName(sub.name) === normalizeServiceName(bundle.name),
    );
    if (alreadyUsing) continue;

    const currentTotalCost = matched.reduce(
      (sum, sub) => sum + sub.monthlyPrice,
      0,
    );

    if (bundle.conditional) {
      // 조건부 번들: 2개 이상 매칭 시 참고 정보로 표시
      if (matched.length >= 2) {
        const matchedNames = matched.map((s) => s.name).join(', ');
        results.push({
          bundle,
          matchedSubscriptions: matched,
          currentTotalCost,
          bundleCost: bundle.price,
          monthlySavings: 0,
          explanation: `${bundle.provider} 가입자라면 ${matchedNames}을(를) ${bundle.name} 혜택으로 이용할 수 있어요.`,
          type: 'info',
        });
      }
    } else if (bundle.price < currentTotalCost) {
      // 비조건부 + 번들이 더 저렴 → 실질 절약 추천
      const monthlySavings = currentTotalCost - bundle.price;
      const matchedNames = matched.map((s) => s.name).join(', ');

      results.push({
        bundle,
        matchedSubscriptions: matched,
        currentTotalCost,
        bundleCost: bundle.price,
        monthlySavings,
        explanation: `${matchedNames}을(를) ${bundle.name}으로 통합하면 월 ${monthlySavings.toLocaleString()}원을 절약할 수 있어요.`,
        type: 'savings',
      });
    } else if (matched.length >= 2) {
      // 비조건부 + 더 비싸지만 2개 이상 매칭 → 참고 정보
      const matchedNames = matched.map((s) => s.name).join(', ');
      results.push({
        bundle,
        matchedSubscriptions: matched,
        currentTotalCost,
        bundleCost: bundle.price,
        monthlySavings: 0,
        explanation: `${matchedNames}을(를) 포함하는 ${bundle.name}도 있어요. 가족과 공유하면 더 저렴할 수 있어요.`,
        type: 'info',
      });
    }
  }

  // 절약 추천 우선 (절약액 내림차순), 그 다음 참고 정보 (매칭 수 내림차순)
  return results.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'savings' ? -1 : 1;
    if (a.type === 'savings') return b.monthlySavings - a.monthlySavings;
    return b.matchedSubscriptions.length - a.matchedSubscriptions.length;
  });
}

/**
 * Find subscriptions that match a bundle's included services
 */
function findMatchingSubscriptions(
  subscriptions: Subscription[],
  bundle: BundleDeal,
): Subscription[] {
  return subscriptions.filter((sub) =>
    bundle.includedServices.some(
      (included) =>
        sub.name.includes(included) ||
        included.includes(sub.name) ||
        normalizeServiceName(sub.name) === normalizeServiceName(included),
    ),
  );
}

/**
 * Calculate savings from switching to a specific bundle
 */
export function calculateBundleSavings(
  currentSubscriptions: Subscription[],
  bundle: BundleDeal,
): { savings: number; replacedCount: number } {
  const matched = findMatchingSubscriptions(currentSubscriptions, bundle);
  const currentCost = matched.reduce(
    (sum, sub) => sum + sub.monthlyPrice,
    0,
  );

  return {
    savings: Math.max(0, currentCost - bundle.price),
    replacedCount: matched.length,
  };
}

/**
 * Normalize service name for fuzzy matching
 */
function normalizeServiceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[+]/g, '플러스');
}
