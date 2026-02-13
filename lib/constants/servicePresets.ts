import type { SubscriptionCategory, BillingCycle } from '@/lib/types/subscription';

export interface ServicePlan {
  name: string;
  price: number;
  cycle: BillingCycle;
  currency?: 'KRW' | 'USD'; // default: 'KRW'
}

export interface FamilyPlan {
  name: string;
  price: number;
  cycle: BillingCycle;
  maxMembers: number;
  currency?: 'KRW' | 'USD';
}

export interface PersonalizedROIField {
  key: string;           // 'monthlySpending', 'orderCount', etc.
  label: string;         // '월 카드 결제액'
  unit: string;          // '원', '회', '건'
  placeholder: string;   // '500000'
  type: 'currency' | 'number';
  defaultValue?: number;
}

export interface PersonalizedROIConfig {
  fields: PersonalizedROIField[];
  calculate: string; // function name reference - we'll use a separate calculation module
  description: string; // 계산 방식 설명
}

export interface ServicePreset {
  name: string;
  category: SubscriptionCategory;
  icon: string;
  plans: ServicePlan[];
  familyPlan: FamilyPlan | null;
  note?: string;
  cancellationUrl?: string;
  brandColor?: string;
  domain?: string;
  /** Direct logo URL override — used when favicon APIs return low-quality icons */
  logoUrl?: string;
  personalizedROI?: PersonalizedROIConfig;
}

export const SERVICE_PRESETS: Record<string, ServicePreset> = {
  /* ── 영상 스트리밍 (OTT) ────────────────────────────────────── */
  넷플릭스: {
    name: '넷플릭스',
    category: 'video',
    icon: '🎬',
    plans: [
      { name: '광고형 스탠다드', price: 5500, cycle: 'monthly' },
      { name: '스탠다드', price: 13500, cycle: 'monthly' },
      { name: '프리미엄', price: 17000, cycle: 'monthly' },
    ],
    familyPlan: {
      name: '프리미엄',
      price: 17000,
      cycle: 'monthly',
      maxMembers: 4,
    },
    note: '프리미엄 4인 공유 시 인당 4,250원',
    cancellationUrl: 'https://www.netflix.com/cancelplan',
    brandColor: '#E50914',
    domain: 'netflix.com',
    logoUrl: 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://netflix.com&size=128',
  },
  '디즈니+': {
    name: '디즈니+',
    category: 'video',
    icon: '🏰',
    plans: [
      { name: '스탠다드', price: 9900, cycle: 'monthly' },
      { name: '프리미엄', price: 13900, cycle: 'monthly' },
      { name: '스탠다드 연간', price: 99000, cycle: 'yearly' },
    ],
    familyPlan: {
      name: '프리미엄',
      price: 13900,
      cycle: 'monthly',
      maxMembers: 4,
    },
    note: '프리미엄 4인 공유 시 인당 3,475원',
    cancellationUrl: 'https://www.disneyplus.com/account',
    brandColor: '#113CCF',
    domain: 'disneyplus.com',
    logoUrl: 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://disneyplus.com&size=128',
  },
  웨이브: {
    name: '웨이브',
    category: 'video',
    icon: '🌊',
    plans: [
      { name: '베이직', price: 7900, cycle: 'monthly' },
      { name: '스탠다드', price: 10900, cycle: 'monthly' },
      { name: '프리미엄', price: 13900, cycle: 'monthly' },
    ],
    familyPlan: {
      name: '프리미엄',
      price: 13900,
      cycle: 'monthly',
      maxMembers: 4,
    },
    note: '프리미엄 동시접속 4인',
    cancellationUrl: 'https://www.wavve.com/my/membership',
    brandColor: '#1DB4A4',
    domain: 'www.wavve.com',
    logoUrl: 'https://icon.horse/icon/www.wavve.com?size=large',
  },
  티빙: {
    name: '티빙',
    category: 'video',
    icon: '📺',
    plans: [
      { name: '광고형', price: 5500, cycle: 'monthly' },
      { name: '스탠다드', price: 10900, cycle: 'monthly' },
      { name: '프리미엄', price: 13900, cycle: 'monthly' },
    ],
    familyPlan: {
      name: '프리미엄',
      price: 13900,
      cycle: 'monthly',
      maxMembers: 4,
    },
    note: '프리미엄 동시접속 4인',
    cancellationUrl: 'https://www.tving.com/my',
    brandColor: '#FF0558',
    domain: 'tving.com',
    logoUrl: 'https://icon.horse/icon/tving.com?size=large',
  },
  쿠팡플레이: {
    name: '쿠팡플레이',
    category: 'video',
    icon: '🎥',
    plans: [{ name: '로켓와우 포함', price: 7890, cycle: 'monthly' }],
    familyPlan: null,
    note: '쿠팡 로켓와우 멤버십에 포함',
    cancellationUrl: 'https://www.coupang.com/np/coupangPlay',
    brandColor: '#E6282E',
    domain: 'coupangplay.com',
    logoUrl: 'https://icon.horse/icon/coupangplay.com?size=large',
  },
  왓챠: {
    name: '왓챠',
    category: 'video',
    icon: '🍿',
    plans: [
      { name: '베이직', price: 7900, cycle: 'monthly' },
      { name: '프리미엄', price: 12900, cycle: 'monthly' },
    ],
    familyPlan: {
      name: '프리미엄',
      price: 12900,
      cycle: 'monthly',
      maxMembers: 4,
    },
    note: '프리미엄 동시접속 4인',
    cancellationUrl: 'https://watcha.com/settings/account',
    brandColor: '#FF0558',
    domain: 'watcha.com',
    logoUrl: 'https://icon.horse/icon/watcha.com?size=large',
  },
  'Apple TV+': {
    name: 'Apple TV+',
    category: 'video',
    icon: '🍎',
    plans: [
      { name: '개인', price: 9900, cycle: 'monthly' },
      { name: '연간', price: 99000, cycle: 'yearly' },
    ],
    familyPlan: {
      name: '가족 공유',
      price: 14900,
      cycle: 'monthly',
      maxMembers: 6,
    },
    note: 'Apple One 번들 가능',
    cancellationUrl: 'https://support.apple.com/ko-kr/111771',
    brandColor: '#000000',
    domain: 'tv.apple.com',
    logoUrl: 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://apple.com&size=128',
  },
  'Amazon Prime': {
    name: 'Amazon Prime',
    category: 'video',
    icon: '📦',
    plans: [
      { name: '월간', price: 5900, cycle: 'monthly' },
      { name: '연간', price: 49000, cycle: 'yearly' },
    ],
    familyPlan: null,
    cancellationUrl: 'https://www.amazon.co.kr/gp/primecentral',
    brandColor: '#00A8E1',
    domain: 'primevideo.com',
    logoUrl: 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://amazon.com&size=128',
  },
  유튜브프리미엄: {
    name: '유튜브 프리미엄',
    category: 'video',
    icon: '▶️',
    plans: [
      { name: '개인', price: 14900, cycle: 'monthly' },
      { name: '연간', price: 149000, cycle: 'yearly' },
    ],
    familyPlan: {
      name: '패밀리',
      price: 23900,
      cycle: 'monthly',
      maxMembers: 6,
    },
    note: 'YouTube Music 포함',
    cancellationUrl: 'https://www.youtube.com/paid_memberships',
    brandColor: '#FF0000',
    domain: 'youtube.com',
    logoUrl: 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://youtube.com&size=128',
  },

  /* ── 음악 ────────────────────────────────────────────────── */
  스포티파이: {
    name: '스포티파이',
    category: 'music',
    icon: '🎧',
    plans: [
      { name: '개인', price: 10900, cycle: 'monthly' },
      { name: '듀오', price: 14900, cycle: 'monthly' },
    ],
    familyPlan: {
      name: '패밀리',
      price: 16900,
      cycle: 'monthly',
      maxMembers: 6,
    },
    note: '패밀리 6인 공유 시 인당 약 2,817원',
    cancellationUrl: 'https://www.spotify.com/account/subscription/',
    brandColor: '#1DB954',
    domain: 'spotify.com',
    logoUrl: 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://spotify.com&size=128',
  },
  'Apple Music': {
    name: 'Apple Music',
    category: 'music',
    icon: '🎵',
    plans: [
      { name: '음성', price: 5900, cycle: 'monthly' },
      { name: '학생', price: 5900, cycle: 'monthly' },
      { name: '개인', price: 11000, cycle: 'monthly' },
    ],
    familyPlan: {
      name: '가족',
      price: 16900,
      cycle: 'monthly',
      maxMembers: 6,
    },
    note: 'Apple One 번들 가능',
    cancellationUrl: 'https://support.apple.com/ko-kr/108380',
    brandColor: '#FA2D48',
    domain: 'music.apple.com',
    logoUrl: 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://apple.com&size=128',
  },
  '지니뮤직': {
    name: '지니뮤직',
    category: 'music',
    icon: '🎶',
    plans: [
      { name: '스트리밍', price: 7900, cycle: 'monthly' },
      { name: '스트리밍+다운로드', price: 10900, cycle: 'monthly' },
    ],
    familyPlan: null,
    note: '통신사 제휴 할인 가능',
    cancellationUrl: 'https://www.genie.co.kr/myInfo/payment',
    brandColor: '#3B82F6',
    domain: 'genie.co.kr',
    logoUrl: 'https://icon.horse/icon/genie.co.kr?size=large',
  },
  '멜론': {
    name: '멜론',
    category: 'music',
    icon: '🍈',
    plans: [
      { name: '스트리밍', price: 7900, cycle: 'monthly' },
      { name: '스트리밍+다운로드', price: 10900, cycle: 'monthly' },
    ],
    familyPlan: null,
    note: '카카오 계정 연동',
    cancellationUrl: 'https://www.melon.com/mymusic/ticket/mymusicticket_inform.htm',
    brandColor: '#00CD3C',
    domain: 'melon.com',
    logoUrl: 'https://icon.horse/icon/melon.com?size=large',
  },
  'FLO': {
    name: 'FLO',
    category: 'music',
    icon: '🎼',
    plans: [
      { name: '스트리밍', price: 7900, cycle: 'monthly' },
      { name: '스트리밍+다운로드', price: 10900, cycle: 'monthly' },
    ],
    familyPlan: null,
    note: 'SKT 제휴 할인 가능',
    cancellationUrl: 'https://www.music-flo.com/my/pass',
    brandColor: '#4CEDB0',
    domain: 'music-flo.com',
    logoUrl: 'https://icon.horse/icon/music-flo.com?size=large',
  },
  'YouTube Music': {
    name: 'YouTube Music',
    category: 'music',
    icon: '🎹',
    plans: [{ name: '개인', price: 10900, cycle: 'monthly' }],
    familyPlan: {
      name: '패밀리',
      price: 16900,
      cycle: 'monthly',
      maxMembers: 6,
    },
    note: 'YouTube 프리미엄에 포함',
    cancellationUrl: 'https://www.youtube.com/paid_memberships',
    brandColor: '#FF0000',
    domain: 'music.youtube.com',
    logoUrl: 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://youtube.com&size=128',
  },

  /* ── 쇼핑/배달 ──────────────────────────────────────────── */
  '쿠팡 로켓와우': {
    name: '쿠팡 로켓와우',
    category: 'shopping',
    icon: '🚀',
    plans: [{ name: '월간', price: 7890, cycle: 'monthly' }],
    familyPlan: null,
    note: '쿠팡플레이, 쿠팡이츠 무료배달 포함',
    cancellationUrl: 'https://www.coupang.com/np/coupangPlay',
    brandColor: '#E6282E',
    domain: 'coupang.com',
    logoUrl: 'https://icon.horse/icon/coupang.com?size=large',
    personalizedROI: {
      fields: [
        {
          key: 'orderCount',
          label: '월 로켓배송 주문 횟수',
          unit: '회',
          placeholder: '8',
          type: 'number',
        },
      ],
      calculate: 'coupangWow',
      description: '주문당 배송비 약 ₩3,000 절약 + 쿠팡이츠 무료배달',
    },
  },
  '네이버 플러스': {
    name: '네이버 플러스',
    category: 'shopping',
    icon: '💚',
    plans: [{ name: '월간', price: 4900, cycle: 'monthly' }],
    familyPlan: null,
    note: '네이버페이 적립, 티빙/지니뮤직 혜택 선택',
    cancellationUrl: 'https://nid.naver.com/membership/my',
    brandColor: '#03C75A',
    domain: 'naver.com',
    logoUrl: 'https://icon.horse/icon/naver.com?size=large',
    personalizedROI: {
      fields: [
        {
          key: 'monthlySpending',
          label: '월 네이버페이 결제액',
          unit: '원',
          placeholder: '300000',
          type: 'currency',
        },
      ],
      calculate: 'naverPlus',
      description: '결제액 최대 4% 추가 적립',
    },
  },
  '배민클럽': {
    name: '배민클럽',
    category: 'shopping',
    icon: '🍔',
    plans: [{ name: '월간', price: 4990, cycle: 'monthly' }],
    familyPlan: null,
    note: '무료배달 및 할인 혜택',
    cancellationUrl: 'https://member.baemin.com',
    brandColor: '#2AC1BC',
    domain: 'baemin.com',
    logoUrl: 'https://icon.horse/icon/baemin.com?size=large',
    personalizedROI: {
      fields: [
        {
          key: 'orderCount',
          label: '월 배달 주문 횟수',
          unit: '회',
          placeholder: '5',
          type: 'number',
        },
      ],
      calculate: 'baeminClub',
      description: '주문당 배달비 약 ₩3,000 절약',
    },
  },
  'SSG 멤버십': {
    name: 'SSG 멤버십',
    category: 'shopping',
    icon: '🛍️',
    plans: [{ name: '월간', price: 4900, cycle: 'monthly' }],
    familyPlan: null,
    note: '이마트/SSG 할인 혜택',
    cancellationUrl: 'https://m.ssg.com/myssg/main.ssg',
    brandColor: '#FF5A2E',
    domain: 'ssg.com',
    logoUrl: 'https://icon.horse/icon/ssg.com?size=large',
    personalizedROI: {
      fields: [
        {
          key: 'orderCount',
          label: '월 이마트/SSG 주문 횟수',
          unit: '회',
          placeholder: '4',
          type: 'number',
        },
      ],
      calculate: 'ssgMembership',
      description: '주문당 배송비 약 ₩3,000 절약 + 할인 혜택',
    },
  },
  '컬리패스': {
    name: '컬리패스',
    category: 'shopping',
    icon: '🥬',
    plans: [{ name: '월간', price: 4900, cycle: 'monthly' }],
    familyPlan: null,
    note: '무료배송 및 적립 혜택',
    cancellationUrl: 'https://www.kurly.com/mypage',
    brandColor: '#5F0080',
    domain: 'kurly.com',
    logoUrl: 'https://icon.horse/icon/kurly.com?size=large',
    personalizedROI: {
      fields: [
        {
          key: 'orderCount',
          label: '월 컬리 주문 횟수',
          unit: '회',
          placeholder: '4',
          type: 'number',
        },
      ],
      calculate: 'kurlyPass',
      description: '주문당 배송비 약 ₩3,000 절약 + 적립 혜택',
    },
  },

  /* ── 생산성 ──────────────────────────────────────────────── */
  'MS 365': {
    name: 'MS 365',
    category: 'productivity',
    icon: '💼',
    plans: [
      { name: 'Personal', price: 8900, cycle: 'monthly' },
      { name: 'Personal 연간', price: 89000, cycle: 'yearly' },
    ],
    familyPlan: {
      name: 'Family',
      price: 12900,
      cycle: 'monthly',
      maxMembers: 6,
    },
    note: 'OneDrive 1TB 포함',
    cancellationUrl: 'https://account.microsoft.com/services',
    brandColor: '#D83B01',
    domain: 'microsoft.com',
    logoUrl: 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://microsoft.com&size=128',
  },
  노션: {
    name: '노션',
    category: 'productivity',
    icon: '📝',
    plans: [
      { name: 'Plus', price: 10000, cycle: 'monthly' },
      { name: 'Plus 연간', price: 96000, cycle: 'yearly' },
    ],
    familyPlan: null,
    note: '무료 플랜도 개인용으로 충분',
    cancellationUrl: 'https://www.notion.so/my-account/plans',
    brandColor: '#000000',
    domain: 'notion.so',
    logoUrl: 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://notion.so&size=128',
  },
  ChatGPT: {
    name: 'ChatGPT',
    category: 'productivity',
    icon: '🤖',
    plans: [
      { name: 'Plus', price: 20, cycle: 'monthly', currency: 'USD' },
      { name: 'Pro', price: 200, cycle: 'monthly', currency: 'USD' },
    ],
    familyPlan: null,
    note: 'GPT-4o, o1 등 최신 모델 사용 ($20/월, 환율+부가세 10% 적용)',
    cancellationUrl: 'https://chat.openai.com/settings/subscription',
    brandColor: '#10A37F',
    domain: 'openai.com',
    logoUrl: 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://openai.com&size=128',
  },
  'Claude Pro': {
    name: 'Claude Pro',
    category: 'productivity',
    icon: '🧠',
    plans: [
      { name: 'Pro', price: 20, cycle: 'monthly', currency: 'USD' },
      { name: 'Max (5x)', price: 100, cycle: 'monthly', currency: 'USD' },
      { name: 'Max (20x)', price: 200, cycle: 'monthly', currency: 'USD' },
    ],
    familyPlan: null,
    note: 'Claude 4 Opus/Sonnet 최신 AI 모델 ($20/월, 환율+부가세 10% 적용)',
    cancellationUrl: 'https://claude.ai/settings',
    brandColor: '#D97757',
    domain: 'claude.ai',
  },
  'Gemini Advanced': {
    name: 'Gemini Advanced',
    category: 'productivity',
    icon: '✨',
    plans: [
      { name: 'Advanced (Google One AI)', price: 19.99, cycle: 'monthly', currency: 'USD' },
    ],
    familyPlan: null,
    note: 'Gemini Ultra + Google One 2TB ($19.99/월, 환율+부가세 10% 적용)',
    cancellationUrl: 'https://one.google.com/settings',
    brandColor: '#4285F4',
    domain: 'gemini.google.com',
  },
  'Perplexity Pro': {
    name: 'Perplexity Pro',
    category: 'productivity',
    icon: '🔎',
    plans: [
      { name: 'Pro 월간', price: 20, cycle: 'monthly', currency: 'USD' },
      { name: 'Pro 연간', price: 200, cycle: 'yearly', currency: 'USD' },
    ],
    familyPlan: null,
    note: 'AI 검색 무제한 Pro 모드 ($20/월, 환율+부가세 10% 적용)',
    cancellationUrl: 'https://www.perplexity.ai/settings/subscription',
    brandColor: '#20808D',
    domain: 'perplexity.ai',
  },
  'GitHub Copilot': {
    name: 'GitHub Copilot',
    category: 'productivity',
    icon: '👨‍💻',
    plans: [
      { name: 'Individual', price: 10, cycle: 'monthly', currency: 'USD' },
      { name: 'Individual 연간', price: 100, cycle: 'yearly', currency: 'USD' },
      { name: 'Business', price: 19, cycle: 'monthly', currency: 'USD' },
    ],
    familyPlan: null,
    note: 'AI 코딩 어시스턴트 ($10/월, 환율+부가세 10% 적용)',
    cancellationUrl: 'https://github.com/settings/copilot',
    brandColor: '#000000',
    domain: 'github.com',
  },
  'Cursor Pro': {
    name: 'Cursor Pro',
    category: 'productivity',
    icon: '⌨️',
    plans: [
      { name: 'Pro', price: 20, cycle: 'monthly', currency: 'USD' },
      { name: 'Business', price: 40, cycle: 'monthly', currency: 'USD' },
    ],
    familyPlan: null,
    note: 'AI 코드 에디터 ($20/월, 환율+부가세 10% 적용)',
    cancellationUrl: 'https://www.cursor.com/settings',
    brandColor: '#000000',
    domain: 'cursor.com',
  },
  Midjourney: {
    name: 'Midjourney',
    category: 'productivity',
    icon: '🎨',
    plans: [
      { name: 'Basic', price: 10, cycle: 'monthly', currency: 'USD' },
      { name: 'Standard', price: 30, cycle: 'monthly', currency: 'USD' },
      { name: 'Pro', price: 60, cycle: 'monthly', currency: 'USD' },
    ],
    familyPlan: null,
    note: 'AI 이미지 생성 ($10/월~, 환율+부가세 10% 적용)',
    cancellationUrl: 'https://www.midjourney.com/account',
    brandColor: '#000000',
    domain: 'midjourney.com',
  },
  Grammarly: {
    name: 'Grammarly',
    category: 'productivity',
    icon: '✍️',
    plans: [
      { name: 'Premium 월간', price: 12, cycle: 'monthly', currency: 'USD' },
      { name: 'Premium 연간', price: 144, cycle: 'yearly', currency: 'USD' },
    ],
    familyPlan: null,
    note: 'AI 영문법 교정 ($12/월, 환율+부가세 10% 적용)',
    cancellationUrl: 'https://account.grammarly.com/subscription',
    brandColor: '#15C39A',
    domain: 'grammarly.com',
  },
  Canva: {
    name: 'Canva',
    category: 'productivity',
    icon: '🎨',
    plans: [
      { name: 'Pro 월간', price: 14900, cycle: 'monthly' },
      { name: 'Pro 연간', price: 119900, cycle: 'yearly' },
    ],
    familyPlan: {
      name: 'Teams',
      price: 29900,
      cycle: 'monthly',
      maxMembers: 5,
    },
    note: '디자인 템플릿 및 AI 기능',
    cancellationUrl: 'https://www.canva.com/settings/billing',
    brandColor: '#00C4CC',
    domain: 'canva.com',
  },
  피그마: {
    name: '피그마',
    category: 'productivity',
    icon: '✏️',
    plans: [
      { name: 'Professional', price: 15000, cycle: 'monthly' },
      { name: 'Organization', price: 45000, cycle: 'monthly' },
    ],
    familyPlan: null,
    note: '무료 플랜 3프로젝트 제한',
    cancellationUrl: 'https://www.figma.com/settings',
    brandColor: '#F24E1E',
    domain: 'figma.com',
  },

  /* ── 클라우드 ────────────────────────────────────────────── */
  'iCloud+': {
    name: 'iCloud+',
    category: 'cloud',
    icon: '☁️',
    plans: [
      { name: '50GB', price: 1100, cycle: 'monthly' },
      { name: '200GB', price: 3300, cycle: 'monthly' },
      { name: '2TB', price: 11000, cycle: 'monthly' },
      { name: '6TB', price: 33000, cycle: 'monthly' },
      { name: '12TB', price: 65000, cycle: 'monthly' },
    ],
    familyPlan: {
      name: '200GB 가족공유',
      price: 3300,
      cycle: 'monthly',
      maxMembers: 6,
    },
    note: 'Apple 기기 백업 필수',
    cancellationUrl: 'https://support.apple.com/ko-kr/108052',
    brandColor: '#3693F3',
    domain: 'icloud.com',
  },
  'Google One': {
    name: 'Google One',
    category: 'cloud',
    icon: '🔵',
    plans: [
      { name: '100GB', price: 2400, cycle: 'monthly' },
      { name: '200GB', price: 3700, cycle: 'monthly' },
      { name: '2TB', price: 11900, cycle: 'monthly' },
    ],
    familyPlan: {
      name: '200GB 가족',
      price: 3700,
      cycle: 'monthly',
      maxMembers: 6,
    },
    note: 'Google 포토/Gmail/드라이브 통합',
    cancellationUrl: 'https://one.google.com/settings',
    brandColor: '#4285F4',
    domain: 'one.google.com',
  },
  Dropbox: {
    name: 'Dropbox',
    category: 'cloud',
    icon: '📦',
    plans: [
      { name: 'Plus', price: 13900, cycle: 'monthly' },
      { name: 'Plus 연간', price: 137900, cycle: 'yearly' },
    ],
    familyPlan: {
      name: 'Family',
      price: 22900,
      cycle: 'monthly',
      maxMembers: 6,
    },
    cancellationUrl: 'https://www.dropbox.com/account/plan',
    brandColor: '#0061FF',
    domain: 'dropbox.com',
  },

  /* ── 게임 ────────────────────────────────────────────────── */
  'Nintendo Online': {
    name: 'Nintendo Online',
    category: 'gaming',
    icon: '🎮',
    plans: [
      { name: '개인 1개월', price: 5500, cycle: 'monthly' },
      { name: '개인 연간', price: 25000, cycle: 'yearly' },
      { name: '개인+확장팩 연간', price: 50000, cycle: 'yearly' },
    ],
    familyPlan: {
      name: '패밀리 연간',
      price: 45000,
      cycle: 'yearly',
      maxMembers: 8,
    },
    note: '패밀리 8인까지 공유 가능',
    cancellationUrl: 'https://ec.nintendo.com/my/membership',
    brandColor: '#E60012',
    domain: 'nintendo.com',
  },
  'PS Plus': {
    name: 'PS Plus',
    category: 'gaming',
    icon: '🕹️',
    plans: [
      { name: 'Essential 월간', price: 9900, cycle: 'monthly' },
      { name: 'Essential 연간', price: 59900, cycle: 'yearly' },
      { name: 'Extra 연간', price: 109900, cycle: 'yearly' },
      { name: 'Premium 연간', price: 139900, cycle: 'yearly' },
    ],
    familyPlan: null,
    cancellationUrl: 'https://store.playstation.com/ko-kr/latest',
    brandColor: '#003791',
    domain: 'playstation.com',
  },
  'Xbox GP': {
    name: 'Xbox GP',
    category: 'gaming',
    icon: '🟩',
    plans: [
      { name: 'Core 월간', price: 7900, cycle: 'monthly' },
      { name: 'Standard 월간', price: 14900, cycle: 'monthly' },
      { name: 'Ultimate 월간', price: 18900, cycle: 'monthly' },
    ],
    familyPlan: null,
    note: 'PC + Console 통합',
    cancellationUrl: 'https://account.microsoft.com/services',
    brandColor: '#107C10',
    domain: 'xbox.com',
  },

  /* ── 독서 ────────────────────────────────────────────────── */
  '밀리의 서재': {
    name: '밀리의 서재',
    category: 'reading',
    icon: '📖',
    plans: [
      { name: '기본', price: 9900, cycle: 'monthly' },
      { name: '연간', price: 99000, cycle: 'yearly' },
    ],
    familyPlan: null,
    note: '전자책 무제한 읽기',
    cancellationUrl: 'https://www.millie.co.kr/v3/mypage/subscription',
    brandColor: '#FFCE00',
    domain: 'millie.co.kr',
    logoUrl: 'https://icon.horse/icon/millie.co.kr?size=large',
  },
  리디셀렉트: {
    name: '리디셀렉트',
    category: 'reading',
    icon: '📕',
    plans: [{ name: '기본', price: 9900, cycle: 'monthly' }],
    familyPlan: null,
    note: '전자책/웹소설/만화 구독',
    cancellationUrl: 'https://ridibooks.com/account/membership',
    brandColor: '#1F8CE6',
    domain: 'ridibooks.com',
  },
  '윌라': {
    name: '윌라',
    category: 'reading',
    icon: '🎧',
    plans: [
      { name: '월간', price: 9900, cycle: 'monthly' },
      { name: '연간', price: 79000, cycle: 'yearly' },
    ],
    familyPlan: null,
    note: '오디오북 전문',
    cancellationUrl: 'https://www.welaaa.com/mypage',
    brandColor: '#6C63FF',
    domain: 'welaaa.com',
  },
  'YES24 북클럽': {
    name: 'YES24 북클럽',
    category: 'reading',
    icon: '📗',
    plans: [{ name: '기본', price: 9500, cycle: 'monthly' }],
    familyPlan: null,
    note: '전자책 무제한 구독',
    cancellationUrl: 'https://bookclub.yes24.com/MyRoom',
    brandColor: '#D51921',
    domain: 'yes24.com',
  },
  '킨들 언리미티드': {
    name: '킨들 언리미티드',
    category: 'reading',
    icon: '📱',
    plans: [{ name: '기본', price: 11900, cycle: 'monthly' }],
    familyPlan: null,
    note: 'Amazon 전자책 구독',
    cancellationUrl: 'https://www.amazon.co.kr/kindle-dbs/hz/subscribe/ku',
    brandColor: '#FF9900',
    domain: 'amazon.com',
  },

  /* ── 금융 ────────────────────────────────────────────────── */
  '토스 프라임': {
    name: '토스 프라임',
    category: 'other',
    icon: '💙',
    plans: [{ name: '월간', price: 5900, cycle: 'monthly' }],
    familyPlan: null,
    note: '송금 수수료 면제, 토스증권 혜택, 보험 할인, 은행 금리 우대 등',
    cancellationUrl: 'https://app.toss.im',
    brandColor: '#0064FF',
    domain: 'toss.im',
    logoUrl: 'https://icon.horse/icon/toss.im?size=large',
    personalizedROI: {
      fields: [
        {
          key: 'monthlySpending',
          label: '월 카드 결제 총액',
          unit: '원',
          placeholder: '500000',
          type: 'currency',
        },
      ],
      calculate: 'tossPrime',
      description: '결제액 4% 적립 (100만원 초과분 1%)',
    },
  },
};

/** Array version for iteration */
export const SERVICE_PRESETS_LIST: ServicePreset[] =
  Object.values(SERVICE_PRESETS);

/** Get preset by name (exact match → space-stripped match → preset.name match) */
export function getServicePreset(name: string): ServicePreset | undefined {
  if (SERVICE_PRESETS[name]) return SERVICE_PRESETS[name];

  const stripped = name.replace(/\s/g, '');
  if (SERVICE_PRESETS[stripped]) return SERVICE_PRESETS[stripped];

  return SERVICE_PRESETS_LIST.find(
    (p) => p.name.replace(/\s/g, '') === stripped,
  );
}

/** Get presets filtered by category */
export function getPresetsByCategory(
  category: SubscriptionCategory,
): ServicePreset[] {
  return SERVICE_PRESETS_LIST.filter((s) => s.category === category);
}
