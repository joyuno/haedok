/**
 * OpenRouter LLM API 유틸리티
 * 클라이언트 사이드에서 호출 (static export 환경)
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

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

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://subscout-five.vercel.app',
        'X-Title': 'SubScout',
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
