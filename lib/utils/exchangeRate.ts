// USD/KRW 당일 환율 조회 (무료 API, 클라이언트사이드)
// 하루 1회 조회, 24시간 localStorage 캐시

const CACHE_KEY = 'haedok_exchange_rate';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

interface ExchangeRateCache {
  rate: number;
  timestamp: number;
}

export async function getUSDtoKRW(): Promise<number> {
  // Check cache first
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data: ExchangeRateCache = JSON.parse(cached);
        if (Date.now() - data.timestamp < CACHE_DURATION) {
          return data.rate;
        }
      }
    } catch {}
  }

  // Fetch from free API
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    const rate = data.rates?.KRW;
    if (rate && typeof rate === 'number') {
      // Cache
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
      }
      return rate;
    }
  } catch {}

  // Fallback rate (updated 2025-02)
  return 1450;
}

/** VAT rate for overseas digital services (Korean tax law) */
const VAT_RATE = 0.1;

/** Convert USD to KRW with 10% VAT (해외 디지털 서비스 부가세) */
export function convertUSDtoKRW(usdAmount: number, rate: number): number {
  const baseKRW = usdAmount * rate;
  const withVAT = baseKRW * (1 + VAT_RATE);
  return Math.round(withVAT);
}

/** Format exchange rate info (부가세 포함 표시) */
export function formatExchangeInfo(usdPrice: number, krwPrice: number, rate: number): string {
  const baseKRW = Math.round(usdPrice * rate);
  return `$${usdPrice.toFixed(2)} × ${rate.toFixed(0)}원 + 부가세 10% = ${krwPrice.toLocaleString('ko-KR')}원`;
}
