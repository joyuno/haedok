export interface DiscountEvent {
  id: string;
  title: string;
  provider: string;
  type: 'card' | 'telecom' | 'promotion' | 'bundle_deal';
  targetServices: string[];  // which subscription services this applies to
  discountAmount?: number;   // in KRW
  discountPercent?: number;  // percentage
  description: string;
  conditions?: string;
  validUntil?: string;       // "상시" or date string
  url?: string;
  icon: string;              // emoji (fallback)
  /** 파비콘 조회용 도메인 */
  domain?: string;
  /** 브랜드 색상 (fallback 아이콘용) */
  brandColor?: string;
}

export const DISCOUNT_EVENTS: DiscountEvent[] = [
  // Card discounts
  {
    id: 'samsung-id-on',
    title: '삼성 iD ON 카드',
    provider: '삼성카드',
    type: 'card',
    targetServices: ['넷플릭스', '티빙', '웨이브', '왓챠'],
    discountPercent: 10,
    description: 'OTT 스트리밍 결제 시 10% 할인',
    conditions: '전월 실적 30만원 이상',
    validUntil: '상시',
    url: 'https://www.samsungcard.com/personal/card/card-detail?id=iD_ON',
    icon: '💳',
    domain: 'samsungcard.com',
    brandColor: '#0C4DA2',
  },
  {
    id: 'shinhan-subscription',
    title: '신한 구독좋아요 카드',
    provider: '신한카드',
    type: 'card',
    targetServices: ['넷플릭스', '유튜브 프리미엄', '스포티파이', '디즈니+', '티빙'],
    discountAmount: 5000,
    description: '구독 서비스 결제 시 월 최대 5,000원 할인',
    conditions: '전월 실적 40만원 이상 시 5,000원 / 30만원 이상 시 2,000원',
    validUntil: '상시',
    url: 'https://www.shinhancard.com/pconts/html/card/apply/credit/1199524_2207.html',
    icon: '💳',
    domain: 'shinhancard.com',
    brandColor: '#0046FF',
  },
  {
    id: 'kb-tok-tok',
    title: 'KB Tok Tok O 카드',
    provider: 'KB국민카드',
    type: 'card',
    targetServices: ['디즈니+', '넷플릭스', '티빙'],
    discountAmount: 10000,
    description: '디즈니+ 등 OTT 구독 시 최대 10,000원 할인',
    conditions: '신규 발급 또는 전월 실적 조건 충족 시',
    validUntil: '상시',
    url: 'https://card.kbcard.com/CRD/DICA/DICACC01',
    icon: '💳',
    domain: 'kbcard.com',
    brandColor: '#FFBC00',
  },
  {
    id: 'nh-byuldaka',
    title: 'NH농협 별다카',
    provider: 'NH농협카드',
    type: 'card',
    targetServices: ['디즈니+', '넷플릭스', '유튜브 프리미엄'],
    discountPercent: 5,
    description: 'OTT 결제 시 5% 할인 (최대 2,000원)',
    conditions: '전월 실적 30만원 이상',
    validUntil: '상시',
    url: 'https://card.nonghyup.com/app/card/credit',
    icon: '💳',
    domain: 'nonghyup.com',
    brandColor: '#007C3D',
  },
  {
    id: 'lotte-loca365',
    title: '롯데 LOCA 365 카드',
    provider: '롯데카드',
    type: 'card',
    targetServices: ['디즈니+', '넷플릭스'],
    discountAmount: 1500,
    description: 'OTT 월 1,500원 즉시 할인',
    conditions: '전월 실적 30만원 이상',
    validUntil: '상시',
    url: 'https://www.lottecard.co.kr/app/LPCDAAF_V100.lc',
    icon: '💳',
    domain: 'lottecard.co.kr',
    brandColor: '#ED1C24',
  },
  {
    id: 'samsung-id-sweet',
    title: '삼성 iD 스위트',
    provider: '삼성카드',
    type: 'card',
    targetServices: ['디즈니+'],
    discountPercent: 50,
    description: '디즈니+ 구독 50% 할인',
    conditions: '전월 실적 조건 충족 시',
    validUntil: '상시',
    url: 'https://www.samsungcard.com/personal/card/card-detail?id=iD_SWEET',
    icon: '💳',
    domain: 'samsungcard.com',
    brandColor: '#0C4DA2',
  },
  // Telecom promotions
  {
    id: 'lgu-double-streaming',
    title: 'LG U+ 더블 스트리밍 연간권',
    provider: 'LG U+',
    type: 'telecom',
    targetServices: ['유튜브 프리미엄', '넷플릭스'],
    description: '유튜브 프리미엄 + 넷플릭스 할인 패키지 월 18,900원',
    conditions: '통신사 무관 가입 가능',
    validUntil: '상시',
    url: 'https://www.lguplus.com/pogg/product/double-streaming',
    icon: '📶',
    domain: 'lguplus.com',
    brandColor: '#E6007E',
  },
  {
    id: 'lgu-yudok-pick2',
    title: 'LG U+ 유독 Pick2',
    provider: 'LG U+',
    type: 'telecom',
    targetServices: ['유튜브 프리미엄'],
    discountAmount: 1000,
    description: '유튜브 프리미엄 13,900원 (정가 대비 1,000원 할인) + 추가 혜택',
    conditions: '통신사 무관 누구나 가능',
    validUntil: '상시',
    url: 'https://www.lguplus.com/pogg/main',
    icon: '📶',
    domain: 'lguplus.com',
    brandColor: '#E6007E',
  },
  {
    id: 'lgu-disney-5pct',
    title: 'LG U+ 유독 디즈니+ 할인',
    provider: 'LG U+',
    type: 'telecom',
    targetServices: ['디즈니+'],
    discountPercent: 5,
    description: '디즈니+ 스탠다드 5% 할인 구독',
    conditions: 'LG U+ 유독 가입 시',
    validUntil: '상시',
    url: 'https://www.lguplus.com/pogg/product/디즈니플러스-월정액-구독',
    icon: '📶',
    domain: 'lguplus.com',
    brandColor: '#E6007E',
  },
  {
    id: 'skt-tving-webtoon',
    title: 'SKT 티빙&네이버웹툰 결합',
    provider: 'SKT',
    type: 'telecom',
    targetServices: ['티빙'],
    description: '티빙 광고형 + 네이버웹툰 쿠키 30개 월 6,500원',
    conditions: 'SKT 가입자',
    validUntil: '상시',
    url: 'https://www.tworld.co.kr',
    icon: '📱',
    domain: 'tworld.co.kr',
    brandColor: '#E4002B',
  },
  {
    id: 'kt-unlimited-tving',
    title: 'KT 무제한 요금제 티빙 무료',
    provider: 'KT',
    type: 'telecom',
    targetServices: ['티빙', '디즈니+'],
    description: '무제한 요금제 가입 시 티빙 또는 디즈니+ 최대 24개월 무료',
    conditions: 'KT 무제한 요금제 가입자',
    validUntil: '상시',
    url: 'https://product.kt.com/benefit/membership/web/benefit_pkg.html',
    icon: '📡',
    domain: 'kt.com',
    brandColor: '#ED1C24',
  },
  // Promotions
  {
    id: 'naver-plus-tving',
    title: '네이버 플러스 + 티빙 연동',
    provider: '네이버',
    type: 'promotion',
    targetServices: ['티빙'],
    description: '네이버 플러스 멤버십(4,900원)으로 티빙 광고형 무료 이용',
    conditions: '네이버 플러스 멤버십 가입 후 혜택 선택',
    validUntil: '상시',
    url: 'https://nid.naver.com/membership/my',
    icon: '💚',
    domain: 'naver.com',
    brandColor: '#03C75A',
  },
  {
    id: 'disney-annual-40off',
    title: '디즈니+ 연간 구독 40% 할인',
    provider: '디즈니+',
    type: 'promotion',
    targetServices: ['디즈니+'],
    discountPercent: 40,
    description: '디즈니+ 연간 구독 시 최대 40% 할인',
    conditions: '연간 구독 선택 시',
    validUntil: '상시',
    url: 'https://www.disneyplus.com/ko-kr',
    icon: '🏰',
    domain: 'disneyplus.com',
    brandColor: '#113CCF',
  },
  // Bundle deals
  {
    id: 'tving-wavve-disney-3pack',
    title: '티빙+웨이브+디즈니+ 3PACK',
    provider: '티빙/웨이브/디즈니+',
    type: 'bundle_deal',
    targetServices: ['티빙', '웨이브', '디즈니+'],
    description: '3개 OTT 결합 패키지로 개별 구독 대비 할인',
    conditions: '결합 상품 가입',
    validUntil: '상시',
    url: 'https://www.tving.com/event',
    icon: '📦',
    domain: 'tving.com',
    brandColor: '#FF0558',
  },
  {
    id: 'cgv-tving-coupon',
    title: 'CGV 영화 예매 시 티빙 쿠폰',
    provider: 'CGV + 티빙',
    type: 'promotion',
    targetServices: ['티빙'],
    description: 'CGV 특정 영화 예매 시 티빙 1개월 무료 쿠폰 제공',
    conditions: 'CGV 이벤트 기간 중 특정 영화 예매 시',
    validUntil: '이벤트별 상이',
    url: 'https://www.cgv.co.kr/culture-event/event/',
    icon: '🎬',
    domain: 'cgv.co.kr',
    brandColor: '#E51837',
  },
];

// Helper to find events matching user's subscriptions
export function findMatchingEvents(serviceNames: string[]): DiscountEvent[] {
  return DISCOUNT_EVENTS.filter(event =>
    event.targetServices.some(target =>
      serviceNames.some(name =>
        name.includes(target) || target.includes(name)
      )
    )
  );
}

// Group events by type
export function groupEventsByType(events: DiscountEvent[]): Record<string, DiscountEvent[]> {
  return events.reduce((acc, event) => {
    const key = event.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<string, DiscountEvent[]>);
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  card: '카드 할인',
  telecom: '통신사 혜택',
  promotion: '프로모션',
  bundle_deal: '결합 상품',
};
