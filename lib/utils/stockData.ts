/**
 * Stock data utilities for investment simulation
 * Uses Yahoo Finance API with CORS proxy for real-time data
 */

export interface StockDataPoint {
  date: string; // YYYY-MM
  price: number; // 종가
}

export interface StockSeries {
  symbol: string;
  name: string;
  color: string;
  data: StockDataPoint[];
}

export interface DCAResult {
  date: string;
  [key: string]: number | string; // 각 종목별 누적 평가액
}

export const STOCK_CONFIGS = [
  { symbol: '069500.KS', name: 'KODEX 200', color: '#3182F6', fallbackReturn: 0.085 },
  { symbol: '133690.KS', name: 'TIGER 나스닥100', color: '#1FC08E', fallbackReturn: 0.15 },
  { symbol: '000660.KS', name: 'SK하이닉스', color: '#F04452', fallbackReturn: 0.12 },
];

/**
 * Fetch stock data from Yahoo Finance via CORS proxy
 */
async function fetchYahooFinance(symbol: string): Promise<StockDataPoint[]> {
  try {
    const url = `https://corsproxy.io/?https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5y&interval=1mo`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000) // 10초 타임아웃
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const json = await res.json();

    if (!json.chart?.result?.[0]) {
      throw new Error('Invalid response structure');
    }

    const result = json.chart.result[0];
    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;

    if (!timestamps || !closes) {
      throw new Error('Missing timestamp or close data');
    }

    const dataPoints: StockDataPoint[] = [];
    let lastValidPrice = 0;

    for (let i = 0; i < timestamps.length; i++) {
      const price = closes[i] ?? lastValidPrice;
      if (price > 0) {
        lastValidPrice = price;
        const date = new Date(timestamps[i] * 1000);
        dataPoints.push({
          date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          price: Math.round(price * 100) / 100,
        });
      }
    }

    return dataPoints.filter(d => d.price > 0);
  } catch (error) {
    console.warn(`Failed to fetch Yahoo Finance data for ${symbol}:`, error);
    return [];
  }
}

/**
 * Generate fallback data based on historical average returns
 * Uses realistic volatility simulation
 */
function generateFallbackData(annualReturn: number, months: number = 60): StockDataPoint[] {
  const monthlyReturn = Math.pow(1 + annualReturn, 1/12) - 1;
  let price = 100; // 정규화된 시작가
  const now = new Date();
  const data: StockDataPoint[] = [];

  for (let i = months; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    data.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      price: Math.round(price * 100) / 100,
    });

    // 변동성 추가 (정규분포 근사)
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 0.03;

    price *= (1 + monthlyReturn + noise);
    price = Math.max(price, 1); // 최소값 보장
  }

  return data;
}

/**
 * Fetch all stock data (with fallback)
 */
export async function fetchAllStockData(): Promise<StockSeries[]> {
  const results: StockSeries[] = [];

  for (const config of STOCK_CONFIGS) {
    let data = await fetchYahooFinance(config.symbol);

    // Fallback to simulated data if fetch fails
    if (data.length === 0) {
      console.log(`Using fallback data for ${config.name}`);
      data = generateFallbackData(config.fallbackReturn);
    }

    results.push({
      symbol: config.symbol,
      name: config.name,
      color: config.color,
      data,
    });
  }

  return results;
}

/**
 * Simulate Dollar Cost Averaging (DCA) investment
 * @param monthlyAmount Monthly investment amount in KRW
 * @param stockData Array of stock series data
 * @returns Array of results with cumulative values for each month
 */
export function simulateDCA(
  monthlyAmount: number,
  stockData: StockSeries[],
): DCAResult[] {
  if (stockData.length === 0 || monthlyAmount <= 0) {
    return [];
  }

  // 모든 시리즈의 공통 날짜 범위 찾기
  const minLength = Math.min(...stockData.map(s => s.data.length));
  if (minLength === 0) {
    return [];
  }

  const baseData = stockData[0].data.slice(-minLength);
  const results: DCAResult[] = [];

  // 각 종목별 보유 수량 추적
  const holdings: Record<string, number> = {};
  stockData.forEach(s => { holdings[s.name] = 0; });

  for (let i = 0; i < minLength; i++) {
    const point: DCAResult = { date: baseData[i].date };

    // 각 종목에 대해 DCA 계산
    for (const series of stockData) {
      const dataIndex = series.data.length - minLength + i;
      const price = series.data[dataIndex].price;

      // 매월 초 monthlyAmount 만큼 매수
      const sharesPurchased = monthlyAmount / price;
      holdings[series.name] += sharesPurchased;

      // 현재 평가액
      const currentValue = holdings[series.name] * price;
      point[series.name] = Math.round(currentValue);
    }

    // 원금 계산
    point['원금'] = monthlyAmount * (i + 1);

    results.push(point);
  }

  return results;
}
