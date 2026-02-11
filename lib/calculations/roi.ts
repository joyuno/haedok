import type { Subscription } from '@/lib/types/subscription';
import type { ROIGrade, RecommendAction, ROIAnalysis } from '@/lib/types/usage';

/** Average weeks per month */
export const WEEKS_PER_MONTH = 4.33;

/**
 * Calculate cost per minute of usage
 * Returns Infinity if no usage
 */
export function calculateCostPerMinute(
  monthlyPrice: number,
  weeklyUsageMinutes: number,
): number {
  const monthlyMinutes = weeklyUsageMinutes * WEEKS_PER_MONTH;
  if (monthlyMinutes <= 0) return Infinity;
  return monthlyPrice / monthlyMinutes;
}

/**
 * Determine ROI grade based on cost per minute
 *
 * A: < 10원/분 (excellent value)
 * B: 10-30원/분 (decent value)
 * C: 30-70원/분 (inefficient)
 * D: 70-150원/분 (recommend cancel)
 * F: No usage at all
 */
export function calculateROIGrade(costPerMinute: number): ROIGrade {
  if (!isFinite(costPerMinute) || costPerMinute === Infinity) return 'F';
  if (costPerMinute < 10) return 'A';
  if (costPerMinute < 30) return 'B';
  if (costPerMinute < 70) return 'C';
  if (costPerMinute < 150) return 'D';
  return 'D';
}

/**
 * Get recommendation based on grade and context
 */
export function getRecommendation(
  grade: ROIGrade,
  subscription: Subscription,
  sharingAvailable: boolean,
): { action: RecommendAction; reason: string } {
  switch (grade) {
    case 'A':
      return {
        action: 'keep',
        reason: `${subscription.name}은(는) 충분히 활용하고 있어요. 유지하세요!`,
      };
    case 'B':
      if (sharingAvailable && !subscription.isShared) {
        return {
          action: 'share',
          reason: `${subscription.name}을(를) 공유하면 더 저렴하게 이용할 수 있어요.`,
        };
      }
      return {
        action: 'keep',
        reason: `${subscription.name}은(는) 적당히 활용 중이에요. 조금 더 사용하면 좋겠어요.`,
      };
    case 'C':
      if (sharingAvailable && !subscription.isShared) {
        return {
          action: 'share',
          reason: `${subscription.name}의 사용량이 적어요. 공유로 비용을 줄여보세요.`,
        };
      }
      return {
        action: 'downgrade',
        reason: `${subscription.name} 사용량 대비 비용이 높아요. 낮은 요금제를 검토해보세요.`,
      };
    case 'D':
      return {
        action: 'cancel',
        reason: `${subscription.name}을(를) 거의 사용하지 않고 있어요. 해지를 추천해요.`,
      };
    case 'F':
      return {
        action: 'cancel',
        reason: `${subscription.name}을(를) 전혀 사용하지 않고 있어요. 해지하면 월 ${subscription.monthlyPrice.toLocaleString()}원을 절약할 수 있어요.`,
      };
  }
}

/**
 * Calculate full ROI analysis for a subscription
 */
export function calculateROIAnalysis(
  subscription: Subscription,
  weeklyUsageMinutes: number,
  sharingAvailable: boolean,
): ROIAnalysis {
  const costPerMinute = calculateCostPerMinute(
    subscription.monthlyPrice,
    weeklyUsageMinutes,
  );
  const grade = calculateROIGrade(costPerMinute);
  const { action, reason } = getRecommendation(
    grade,
    subscription,
    sharingAvailable,
  );

  const monthlyUsageMinutes = Math.round(weeklyUsageMinutes * WEEKS_PER_MONTH);

  let potentialSavings = 0;
  if (action === 'cancel') {
    potentialSavings = subscription.monthlyPrice;
  } else if (action === 'downgrade') {
    potentialSavings = Math.round(subscription.monthlyPrice * 0.3);
  } else if (action === 'share') {
    potentialSavings = Math.round(subscription.monthlyPrice * 0.5);
  }

  return {
    subscriptionId: subscription.id,
    subscriptionName: subscription.name,
    icon: subscription.icon,
    monthlyPrice: subscription.monthlyPrice,
    weeklyUsageMinutes,
    monthlyUsageMinutes,
    costPerMinute: isFinite(costPerMinute) ? parseFloat(costPerMinute.toFixed(2)) : 0,
    grade,
    recommendation: action,
    recommendationReason: reason,
    potentialSavings,
  };
}
