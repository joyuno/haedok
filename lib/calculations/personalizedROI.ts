import { formatKRW } from '@/lib/utils/formatCurrency';

export interface PersonalizedROIResult {
  savings: number;       // 월 절약/적립 금액
  roi: number;           // ROI 퍼센트 (savings / subscriptionPrice * 100)
  breakdownItems: { label: string; amount: number }[];  // 내역
  verdict: 'excellent' | 'good' | 'break_even' | 'loss';  // 판정
  verdictLabel: string;  // '매우 이득', '이득', '본전', '손해'
  tip: string;           // 팁 메시지
}

/**
 * ROI 판정 및 라벨 생성
 */
function getVerdict(roi: number): { verdict: PersonalizedROIResult['verdict']; verdictLabel: string } {
  if (roi >= 200) {
    return { verdict: 'excellent', verdictLabel: '매우 이득' };
  }
  if (roi >= 100) {
    return { verdict: 'good', verdictLabel: '이득' };
  }
  if (roi >= 80) {
    return { verdict: 'break_even', verdictLabel: '거의 본전' };
  }
  return { verdict: 'loss', verdictLabel: '손해' };
}

/**
 * 토스 프라임 ROI 계산
 * - 100만원 이하: 4% 캐시백
 * - 100만원 초과: 100만원까지 4%, 초과분 1%
 */
export function calculateTossPrime(monthlySpending: number, subscriptionPrice: number): PersonalizedROIResult {
  let savings = 0;

  if (monthlySpending <= 1_000_000) {
    savings = monthlySpending * 0.04;
  } else {
    savings = 1_000_000 * 0.04 + (monthlySpending - 1_000_000) * 0.01;
  }

  const roi = subscriptionPrice > 0 ? (savings / subscriptionPrice) * 100 : 0;
  const { verdict, verdictLabel } = getVerdict(roi);

  return {
    savings,
    roi,
    breakdownItems: [{ label: '캐시백 적립', amount: savings }],
    verdict,
    verdictLabel,
    tip: `월 ${formatKRW(148_000)} 이상 결제하면 본전입니다`,
  };
}

/**
 * 배민클럽 ROI 계산
 * - 배달비 3,000원 × 주문 횟수
 */
export function calculateBaeminClub(orderCount: number, subscriptionPrice: number): PersonalizedROIResult {
  const savings = orderCount * 3_000;
  const roi = subscriptionPrice > 0 ? (savings / subscriptionPrice) * 100 : 0;
  const { verdict, verdictLabel } = getVerdict(roi);

  return {
    savings,
    roi,
    breakdownItems: [{ label: '배달비 절약', amount: savings }],
    verdict,
    verdictLabel,
    tip: '월 2회 이상 주문하면 본전입니다',
  };
}

/**
 * 쿠팡 로켓와우 ROI 계산
 * - 무료배송 3,000원 × 주문 횟수
 */
export function calculateCoupangWow(orderCount: number, subscriptionPrice: number): PersonalizedROIResult {
  const savings = orderCount * 3_000;
  const roi = subscriptionPrice > 0 ? (savings / subscriptionPrice) * 100 : 0;
  const { verdict, verdictLabel } = getVerdict(roi);

  return {
    savings,
    roi,
    breakdownItems: [{ label: '배송비 절약', amount: savings }],
    verdict,
    verdictLabel,
    tip: '월 3회 이상 주문하면 본전입니다',
  };
}

/**
 * 네이버 플러스 ROI 계산
 * - 추가 적립 4%
 */
export function calculateNaverPlus(monthlySpending: number, subscriptionPrice: number): PersonalizedROIResult {
  const savings = monthlySpending * 0.04;
  const roi = subscriptionPrice > 0 ? (savings / subscriptionPrice) * 100 : 0;
  const { verdict, verdictLabel } = getVerdict(roi);

  return {
    savings,
    roi,
    breakdownItems: [{ label: '추가 적립', amount: savings }],
    verdict,
    verdictLabel,
    tip: `월 ${formatKRW(123_000)} 이상 결제하면 본전입니다`,
  };
}

/**
 * SSG 멤버십 ROI 계산
 * - 배송비 절약 3,000원 × 주문 횟수
 */
export function calculateSsgMembership(orderCount: number, subscriptionPrice: number): PersonalizedROIResult {
  const savings = orderCount * 3_000;
  const roi = subscriptionPrice > 0 ? (savings / subscriptionPrice) * 100 : 0;
  const { verdict, verdictLabel } = getVerdict(roi);

  return {
    savings,
    roi,
    breakdownItems: [{ label: '배송비 절약', amount: savings }],
    verdict,
    verdictLabel,
    tip: '월 2회 이상 주문하면 본전입니다',
  };
}

/**
 * 컬리패스 ROI 계산
 * - 배송비 절약 3,000원 × 주문 횟수
 */
export function calculateKurlyPass(orderCount: number, subscriptionPrice: number): PersonalizedROIResult {
  const savings = orderCount * 3_000;
  const roi = subscriptionPrice > 0 ? (savings / subscriptionPrice) * 100 : 0;
  const { verdict, verdictLabel } = getVerdict(roi);

  return {
    savings,
    roi,
    breakdownItems: [{ label: '배송비 절약', amount: savings }],
    verdict,
    verdictLabel,
    tip: '월 2회 이상 주문하면 본전입니다',
  };
}

/**
 * 통합 디스패처
 * calculatorName에 따라 적절한 계산 함수 호출
 */
export function calculatePersonalizedROI(
  calculatorName: string,
  inputs: Record<string, number>,
  subscriptionPrice: number
): PersonalizedROIResult | null {
  switch (calculatorName) {
    case 'tossPrime':
      return calculateTossPrime(inputs.monthlySpending ?? 0, subscriptionPrice);

    case 'baeminClub':
      return calculateBaeminClub(inputs.orderCount ?? 0, subscriptionPrice);

    case 'coupangWow':
      return calculateCoupangWow(inputs.orderCount ?? 0, subscriptionPrice);

    case 'naverPlus':
      return calculateNaverPlus(inputs.monthlySpending ?? 0, subscriptionPrice);

    case 'ssgMembership':
      return calculateSsgMembership(inputs.orderCount ?? 0, subscriptionPrice);

    case 'kurlyPass':
      return calculateKurlyPass(inputs.orderCount ?? 0, subscriptionPrice);

    default:
      return null;
  }
}
