export interface BundleDeal {
  id: string;
  name: string;
  price: number;
  includedServices: string[];
  description: string;
  provider: string;
  note?: string;
  url?: string;
  icon?: string;
  savingsEstimate?: string;
  /** true = 통신사 요금제 조건부 혜택 (절약 계산 제외, 정보 제공만) */
  conditional?: boolean;
  /** 파비콘 조회용 도메인 */
  domain?: string;
  /** 브랜드 색상 (fallback 아이콘용) */
  brandColor?: string;
}

export const BUNDLE_DEALS: BundleDeal[] = [
  /* ── Apple 번들 ─────────────────────────────── */
  {
    id: 'apple-one-individual',
    name: 'Apple One 개인',
    price: 16900,
    includedServices: ['Apple Music', 'Apple TV+', 'iCloud+'],
    description: 'Apple Music + Apple TV+ + iCloud+ 50GB',
    provider: 'Apple',
    icon: '🍎',
    domain: 'apple.com',
    brandColor: '#000000',
    note: '개별 구독 대비 약 8,000원 절약',
    url: 'https://www.apple.com/kr/shop/go/product/apple_one',
    savingsEstimate: '월 ~8,000원 절약',
  },
  {
    id: 'apple-one-family',
    name: 'Apple One 가족',
    price: 22900,
    includedServices: ['Apple Music 가족', 'Apple TV+ 가족', 'iCloud+ 200GB', 'Apple Music', 'Apple TV+', 'iCloud+'],
    description: 'Apple Music + Apple TV+ + iCloud+ 200GB (가족 6인 공유)',
    provider: 'Apple',
    icon: '🍎',
    domain: 'apple.com',
    brandColor: '#000000',
    note: '최대 6인 공유 가능, 개별 대비 최대 30,000원+ 절약',
    url: 'https://www.apple.com/kr/shop/go/product/apple_one',
    savingsEstimate: '6인 공유 시 인당 ~3,800원',
  },

  /* ── 쿠팡 번들 ─────────────────────────────── */
  {
    id: 'coupang-wow',
    name: '쿠팡 로켓와우',
    price: 7890,
    includedServices: ['쿠팡플레이', '쿠팡이츠 무료배달', '로켓배송 무료'],
    description: '쿠팡플레이 + 쿠팡이츠 무료배달 + 로켓배송 무료',
    provider: '쿠팡',
    icon: '🚀',
    domain: 'coupang.com',
    brandColor: '#AF1F1F',
    note: '쿠팡플레이를 별도 구독 중이라면 와우 멤버십으로 통합 가능',
    url: 'https://www.coupang.com/np/coupangPlay',
    savingsEstimate: '쿠팡플레이 포함 월 7,890원',
  },

  /* ── 네이버 번들 ────────────────────────────── */
  {
    id: 'naver-plus',
    name: '네이버 플러스 멤버십',
    price: 4900,
    includedServices: ['티빙', '지니뮤직', '네이버웹툰', '티빙 베이직'],
    description: '네이버페이 적립 + OTT/음악 혜택 선택',
    provider: '네이버',
    icon: '💚',
    domain: 'naver.com',
    brandColor: '#03C75A',
    note: '티빙, 지니뮤직, 네이버웹툰 중 택 1 연동 가능',
    url: 'https://nid.naver.com/membership/my',
    savingsEstimate: '월 4,900원으로 OTT 추가 혜택',
  },

  /* ── 유튜브 번들 ────────────────────────────── */
  {
    id: 'youtube-premium-family',
    name: '유튜브 프리미엄 패밀리',
    price: 23900,
    includedServices: ['유튜브 프리미엄', 'YouTube Music'],
    description: '유튜브 프리미엄 + YouTube Music (가족 6인)',
    provider: 'Google',
    icon: '▶️',
    domain: 'youtube.com',
    brandColor: '#FF0000',
    note: '6인 공유 시 인당 약 3,983원',
    url: 'https://www.youtube.com/paid_memberships',
    savingsEstimate: '6인 공유 시 인당 ~3,983원',
  },

  /* ── 스포티파이 번들 ────────────────────────── */
  {
    id: 'spotify-family',
    name: '스포티파이 패밀리',
    price: 16900,
    includedServices: ['스포티파이'],
    description: '스포티파이 프리미엄 (가족 6인)',
    provider: 'Spotify',
    icon: '🎧',
    domain: 'spotify.com',
    brandColor: '#1DB954',
    note: '6인 공유 시 인당 약 2,817원',
    url: 'https://www.spotify.com/kr/family/',
    savingsEstimate: '6인 공유 시 인당 ~2,817원',
  },

  /* ── Microsoft 번들 ─────────────────────────── */
  {
    id: 'ms365-family',
    name: 'Microsoft 365 Family',
    price: 12900,
    includedServices: ['MS 365', 'Microsoft 365', 'OneDrive 1TB'],
    description: 'Office 앱 + OneDrive 1TB (가족 6인 각자)',
    provider: 'Microsoft',
    icon: '💼',
    domain: 'microsoft.com',
    brandColor: '#0078D4',
    note: '6인 공유 시 인당 약 2,150원 + OneDrive 1TB',
    url: 'https://www.microsoft.com/ko-kr/microsoft-365',
    savingsEstimate: '6인 공유 시 인당 ~2,150원',
  },

  /* ── 통신사 번들 ────────────────────────────── */
  {
    id: 'skt-tuniverse-tving',
    name: 'SKT T우주 티빙',
    price: 4500,
    includedServices: ['티빙', '웨이브', 'FLO', 'Amazon Prime'],
    description: '티빙 광고형 4,500원 / 스탠다드 12,500원 / 프리미엄 16,000원',
    provider: 'SKT',
    icon: '📱',
    domain: 'tworld.co.kr',
    brandColor: '#E4002B',
    note: 'SKT 가입자 전용. 5GX 프라임플러스(99,000원) 이상 요금제 시 티빙 포함',
    url: 'https://www.tworld.co.kr',
    savingsEstimate: '티빙+네이버웹툰 6,500원 결합상품',
  },
  {
    id: 'skt-tuniverse-all',
    name: 'SKT 우주패스 All',
    price: 9900,
    includedServices: ['Google One', '11번가 쿠폰'],
    description: '11번가 아마존 무료배송 + Google One 100GB + 5,000원 쿠폰',
    provider: 'SKT',
    icon: '📱',
    domain: 'tworld.co.kr',
    brandColor: '#E4002B',
    note: 'SKT 가입자 전용. 연 99,000원 옵션 가능',
    url: 'https://sktmembership.tworld.co.kr',
    savingsEstimate: '월 9,900원',
  },
  {
    id: 'kt-membership',
    name: 'KT 고객 보답',
    price: 0,
    includedServices: ['티빙', '디즈니+', '밀리의 서재', '지니뮤직'],
    description: '무제한 요금제 시 티빙/디즈니+ 최대 24개월 무료',
    provider: 'KT',
    icon: '📡',
    domain: 'kt.com',
    brandColor: '#ED1C24',
    note: 'KT 무제한 요금제 가입자. 데이터 추가, 로밍, OTT, 보험 등 혜택',
    url: 'https://product.kt.com/benefit/membership/web/benefit_pkg.html',
    savingsEstimate: '요금제 포함 혜택',
    conditional: true,
  },
  {
    id: 'kt-subscription',
    name: 'KT 구독',
    price: 0,
    includedServices: ['넷플릭스', '유튜브 프리미엄', '디즈니+'],
    description: 'KT 구독 서비스로 OTT 할인 구독',
    provider: 'KT',
    icon: '📡',
    domain: 'kt.com',
    brandColor: '#ED1C24',
    note: 'KT 가입자 대상 다양한 OTT 구독 상품 운영',
    url: 'https://kt.com/z4xz',
    savingsEstimate: '요금제별 상이',
    conditional: true,
  },
  {
    id: 'lgu-yudok',
    name: 'LG U+ 유독',
    price: 0,
    includedServices: ['넷플릭스', '디즈니+', '유튜브 프리미엄', 'Apple TV+', 'Apple Music', '티빙'],
    description: '통신사 무관 OTT/음악 구독 플랫폼. 5G 요금제 시 OTT 무료 포함',
    provider: 'LG U+',
    icon: '📶',
    domain: 'lguplus.com',
    brandColor: '#E6007E',
    note: '유독Pick2: 유튜브프리미엄 13,900원. 5G 시그니처 요금제 시 넷플릭스+유튜브 포함',
    url: 'https://www.lguplus.com/pogg/main',
    savingsEstimate: '유튜브 프리미엄 1,000원 할인 등',
    conditional: true,
  },
  {
    id: 'lgu-5g-signature',
    name: 'LG U+ 5G 시그니처',
    price: 115000,
    includedServices: ['넷플릭스', '유튜브 프리미엄', '디즈니+'],
    description: '넷플릭스 + 유튜브 프리미엄 + VIP 멤버십 포함',
    provider: 'LG U+',
    icon: '📶',
    domain: 'lguplus.com',
    brandColor: '#E6007E',
    note: '선택약정 25% + 가족결합 시 월 5만원대. 5G 무제한 데이터',
    url: 'https://www.lguplus.com/mobile/plan',
    savingsEstimate: '할인 적용 시 월 ~50,000원대',
  },

  /* ── 기타 번들 ──────────────────────────────── */
  {
    id: 'tving-naver',
    name: '티빙 + 네이버 플러스 연동',
    price: 4900,
    includedServices: ['티빙 광고형'],
    description: '네이버 플러스 멤버십으로 티빙 광고형 무료 이용',
    provider: '네이버 + 티빙',
    icon: '🤝',
    domain: 'tving.com',
    brandColor: '#FF0558',
    note: '별도 티빙 구독 없이 네이버 플러스만으로 이용 가능',
    url: 'https://nid.naver.com/membership/my',
    savingsEstimate: '티빙 광고형 5,500원 무료',
  },
  {
    id: 'baemin-coupang-delivery',
    name: '배달 멤버십 비교',
    price: 4990,
    includedServices: ['배민클럽', '배달의민족'],
    description: '배민클럽 vs 쿠팡이츠(와우 포함) 비교',
    provider: '배달앱',
    icon: '🍔',
    domain: 'baemin.com',
    brandColor: '#2AC1BC',
    note: '쿠팡 와우 가입 시 쿠팡이츠 무료배달 포함',
    url: 'https://www.baemin.com/club',
    savingsEstimate: '월 4,990원',
  },
];

/**
 * Find bundle deals that include any of the user's current services
 */
export function findRelevantBundles(
  serviceNames: string[],
): BundleDeal[] {
  return BUNDLE_DEALS.filter((bundle) =>
    bundle.includedServices.some((included) =>
      serviceNames.some(
        (userService) =>
          userService.includes(included) ||
          included.includes(userService),
      ),
    ),
  );
}
