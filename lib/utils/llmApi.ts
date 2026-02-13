/**
 * OpenRouter LLM API 유틸리티
 * 클라이언트 사이드에서 호출 (static export 환경)
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Rate Limiting — 분당 최대 10회, 최소 간격 2초 */
const RATE_LIMIT = {
  maxPerMinute: 10,
  minIntervalMs: 2000,
};

const callTimestamps: number[] = [];
let lastCallTime = 0;

function checkRateLimit(): string | null {
  const now = Date.now();

  // 최소 간격 체크
  if (now - lastCallTime < RATE_LIMIT.minIntervalMs) {
    return `요청이 너무 빠릅니다. ${Math.ceil((RATE_LIMIT.minIntervalMs - (now - lastCallTime)) / 1000)}초 후 다시 시도해주세요.`;
  }

  // 분당 호출 수 체크
  const oneMinuteAgo = now - 60_000;
  while (callTimestamps.length > 0 && callTimestamps[0] < oneMinuteAgo) {
    callTimestamps.shift();
  }
  if (callTimestamps.length >= RATE_LIMIT.maxPerMinute) {
    return '분당 요청 한도(10회)를 초과했습니다. 잠시 후 다시 시도해주세요.';
  }

  return null;
}

function recordCall(): void {
  const now = Date.now();
  lastCallTime = now;
  callTimestamps.push(now);
}

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  success: boolean;
  content: string;
  error?: string;
}

export async function callLLM(messages: LLMMessage[]): Promise<LLMResponse> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      content: '',
      error: 'API 키가 설정되지 않았습니다.',
    };
  }

  // Rate limit 체크
  const rateLimitError = checkRateLimit();
  if (rateLimitError) {
    return {
      success: false,
      content: '',
      error: rateLimitError,
    };
  }

  recordCall();

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://haedok-five.vercel.app',
        'X-Title': '해독',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages,
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        content: '',
        error: `API 오류: ${response.status} ${errorText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      success: true,
      content,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: `네트워크 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    };
  }
}
