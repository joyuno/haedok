import type { Subscription, UsageMetricType } from '@/lib/types/subscription';
import { CATEGORY_METRIC, METRIC_LABELS } from '@/lib/types/subscription';
import type { ROIGrade, RecommendAction, ROIAnalysis } from '@/lib/types/usage';
import { formatKRW } from '@/lib/utils/formatCurrency';

/** Average weeks per month */
export const WEEKS_PER_MONTH = 4.33;

// ── Grade thresholds per metric type ──────────────────────────────

/**
 * time: 시간당 비용 기준 (₩/hour)
 *   A: < ₩600  (분당 <10원)
 *   B: < ₩1,800  (분당 <30원)
 *   C: < ₩4,200  (분당 <70원)
 *   D: < ₩9,000  (분당 <150원)
 */
function gradeByTime(costPerHour: number): ROIGrade {
  if (!isFinite(costPerHour)) return 'F';
  if (costPerHour < 600) return 'A';
  if (costPerHour < 1800) return 'B';
  if (costPerHour < 4200) return 'C';
  return 'D';
}

/**
 * count: 회당 비용 기준 (₩/use)
 *   A: < ₩500   (배달비 대비 매우 저렴)
 *   B: < ₩1,500
 *   C: < ₩3,000  (배달비 수준)
 *   D: ≥ ₩3,000
 */
function gradeByCount(costPerUse: number): ROIGrade {
  if (!isFinite(costPerUse)) return 'F';
  if (costPerUse < 500) return 'A';
  if (costPerUse < 1500) return 'B';
  if (costPerUse < 3000) return 'C';
  return 'D';
}

/**
 * frequency: 주간 사용 일수 기준
 *   A: 5+ days/week
 *   B: 3-4 days/week
 *   C: 1-2 days/week
 *   D: < 1 day/week
 */
function gradeByFrequency(daysPerWeek: number): ROIGrade {
  if (daysPerWeek <= 0) return 'F';
  if (daysPerWeek >= 5) return 'A';
  if (daysPerWeek >= 3) return 'B';
  if (daysPerWeek >= 1) return 'C';
  return 'D';
}

// ── Usage value formatting ────────────────────────────────────────

function formatUsageLabel(metricType: UsageMetricType, value: number): string {
  switch (metricType) {
    case 'time': {
      const hours = value / 60;
      if (hours < 1) return `${Math.round(value)}분/주`;
      return `${hours.toFixed(1)}시간/주`;
    }
    case 'count':
      return `${Math.round(value)}회/월`;
    case 'frequency':
      return `${value.toFixed(1)}일/주`;
  }
}

function formatCostLabel(metricType: UsageMetricType, cost: number): string {
  if (!isFinite(cost) || cost <= 0) return '-';
  const labels = METRIC_LABELS[metricType];
  return `${formatKRW(Math.round(cost))}/${labels.unit}`;
}

// ── Core calculation ──────────────────────────────────────────────

function calculateGradeAndEfficiency(
  metricType: UsageMetricType,
  monthlyPrice: number,
  usageValue: number,
): { grade: ROIGrade; costEfficiency: number } {
  if (usageValue <= 0) {
    return { grade: 'F', costEfficiency: 0 };
  }

  switch (metricType) {
    case 'time': {
      // usageValue = weekly minutes
      const monthlyHours = (usageValue * WEEKS_PER_MONTH) / 60;
      const costPerHour = monthlyPrice / monthlyHours;
      return { grade: gradeByTime(costPerHour), costEfficiency: costPerHour };
    }
    case 'count': {
      // usageValue = monthly count
      const costPerUse = monthlyPrice / usageValue;
      return { grade: gradeByCount(costPerUse), costEfficiency: costPerUse };
    }
    case 'frequency': {
      // usageValue = days per week
      const monthlyDays = usageValue * WEEKS_PER_MONTH;
      const costPerDay = monthlyPrice / monthlyDays;
      return { grade: gradeByFrequency(usageValue), costEfficiency: costPerDay };
    }
  }
}

// ── Recommendation ────────────────────────────────────────────────

function getRecommendation(
  grade: ROIGrade,
  subscription: Subscription,
  metricType: UsageMetricType,
  sharingAvailable: boolean,
): { action: RecommendAction; reason: string } {
  const name = subscription.name;

  switch (grade) {
    case 'A':
      return {
        action: 'keep',
        reason: `${name}은(는) 충분히 활용하고 있어요. 유지하세요!`,
      };
    case 'B':
      if (sharingAvailable && !subscription.isShared) {
        return {
          action: 'share',
          reason: `${name}을(를) 공유하면 더 저렴하게 이용할 수 있어요.`,
        };
      }
      if (metricType === 'count') {
        return {
          action: 'keep',
          reason: `${name}을(를) 적당히 이용 중이에요. 더 자주 이용하면 가성비가 올라가요.`,
        };
      }
      return {
        action: 'keep',
        reason: `${name}은(는) 적당히 활용 중이에요. 조금 더 사용하면 좋겠어요.`,
      };
    case 'C':
      if (sharingAvailable && !subscription.isShared) {
        return {
          action: 'share',
          reason: `${name}의 이용량이 적어요. 공유로 비용을 줄여보세요.`,
        };
      }
      if (metricType === 'count') {
        return {
          action: 'review',
          reason: `${name} 이용 횟수 대비 비용이 높아요. 멤버십 없이 건당 결제가 나을 수 있어요.`,
        };
      }
      return {
        action: 'downgrade',
        reason: `${name} 사용량 대비 비용이 높아요. 낮은 요금제를 검토해보세요.`,
      };
    case 'D':
      if (metricType === 'count') {
        return {
          action: 'cancel',
          reason: `${name}을(를) 거의 이용하지 않고 있어요. 건당 결제로 전환하면 월 ${formatKRW(subscription.monthlyPrice)}을 아낄 수 있어요.`,
        };
      }
      return {
        action: 'cancel',
        reason: `${name}을(를) 거의 사용하지 않고 있어요. 해지를 추천해요.`,
      };
    case 'F':
      return {
        action: 'cancel',
        reason: `${name}을(를) 전혀 사용하지 않고 있어요. 해지하면 월 ${formatKRW(subscription.monthlyPrice)}을 절약할 수 있어요.`,
      };
  }
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Calculate full ROI analysis for a subscription.
 * `usageValue` interpretation depends on `metricType`:
 *   - time: weekly usage in minutes
 *   - count: monthly usage count
 *   - frequency: days per week (0-7)
 */
export function calculateROIAnalysis(
  subscription: Subscription,
  usageValue: number,
  sharingAvailable: boolean,
  metricType?: UsageMetricType,
): ROIAnalysis {
  const metric = metricType || CATEGORY_METRIC[subscription.category];
  const { grade, costEfficiency } = calculateGradeAndEfficiency(metric, subscription.monthlyPrice, usageValue);
  const { action, reason } = getRecommendation(grade, subscription, metric, sharingAvailable);

  // Legacy compat: compute time-based fields
  const weeklyMinutes = metric === 'time' ? usageValue : 0;
  const monthlyMinutes = Math.round(weeklyMinutes * WEEKS_PER_MONTH);
  const costPerMinute = monthlyMinutes > 0 ? subscription.monthlyPrice / monthlyMinutes : 0;

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
    category: subscription.category,
    monthlyPrice: subscription.monthlyPrice,
    metricType: metric,
    usageValue,
    usageLabel: formatUsageLabel(metric, usageValue),
    costEfficiency,
    costEfficiencyLabel: formatCostLabel(metric, costEfficiency),
    // Legacy
    weeklyUsageMinutes: weeklyMinutes,
    monthlyUsageMinutes: monthlyMinutes,
    costPerMinute: isFinite(costPerMinute) ? parseFloat(costPerMinute.toFixed(2)) : 0,
    grade,
    recommendation: action,
    recommendationReason: reason,
    potentialSavings,
  };
}

// Keep old exports for any code that still imports them
export { WEEKS_PER_MONTH as default };
export function calculateCostPerMinute(monthlyPrice: number, weeklyUsageMinutes: number): number {
  const monthlyMinutes = weeklyUsageMinutes * WEEKS_PER_MONTH;
  if (monthlyMinutes <= 0) return Infinity;
  return monthlyPrice / monthlyMinutes;
}
export function calculateROIGrade(costPerMinute: number): ROIGrade {
  if (!isFinite(costPerMinute) || costPerMinute === Infinity) return 'F';
  if (costPerMinute < 10) return 'A';
  if (costPerMinute < 30) return 'B';
  if (costPerMinute < 70) return 'C';
  return 'D';
}
