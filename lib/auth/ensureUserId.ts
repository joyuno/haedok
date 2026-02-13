import { supabase } from '@/lib/supabase';

const DEVICE_ID_KEY = 'haedok-device-id';
let _cachedUserId: string | null = null;

/**
 * 항상 유효한 user_id를 반환하는 유틸리티.
 * 우선순위:
 * 1. 캐시된 user_id (가장 빠름)
 * 2. Supabase auth 세션의 user.id
 * 3. 익명 로그인으로 생성된 user.id
 * 4. 이메일 기반 자동 가입으로 생성된 user.id
 * 5. 디바이스 UUID (auth 없이 직접 사용)
 */
export async function ensureUserId(): Promise<string | null> {
  // 1. 캐시 확인
  if (_cachedUserId) return _cachedUserId;

  // 2. 기존 세션 확인
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      _cachedUserId = session.user.id;
      return _cachedUserId;
    }
  } catch {
    // 세션 확인 실패, 계속 진행
  }

  // 3. 익명 로그인 시도
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data?.user) {
      _cachedUserId = data.user.id;
      // 프로필 생성 (실패해도 계속)
      await supabase.from('profiles').upsert({
        id: data.user.id,
        nickname: `사용자_${data.user.id.slice(0, 6)}`,
      }, { onConflict: 'id' }).then(() => {});
      saveDeviceId(data.user.id);
      console.log('[Auth] 익명 로그인 성공:', data.user.id.slice(0, 8));
      return _cachedUserId;
    }
  } catch {
    console.warn('[Auth] 익명 로그인 미지원, 이메일 가입 시도');
  }

  // 4. 디바이스 기반 이메일 가입 시도
  const deviceId = getOrCreateDeviceId();
  const email = `device_${deviceId.replace(/-/g, '')}@haedok.app`;
  const password = `hd_${deviceId}`;

  try {
    // 기존 계정으로 로그인 시도
    const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
    if (signInData?.user) {
      _cachedUserId = signInData.user.id;
      saveDeviceId(signInData.user.id);
      console.log('[Auth] 디바이스 계정 로그인 성공:', signInData.user.id.slice(0, 8));
      return _cachedUserId;
    }

    // 새 계정 생성
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { is_device: true } },
    });
    if (!signUpError && signUpData?.user) {
      _cachedUserId = signUpData.user.id;
      // 프로필 생성
      await supabase.from('profiles').upsert({
        id: signUpData.user.id,
        nickname: `사용자_${signUpData.user.id.slice(0, 6)}`,
      }, { onConflict: 'id' }).then(() => {});
      saveDeviceId(signUpData.user.id);
      console.log('[Auth] 디바이스 계정 생성 성공:', signUpData.user.id.slice(0, 8));
      return _cachedUserId;
    }
  } catch (e) {
    console.warn('[Auth] 이메일 가입도 실패:', e);
  }

  // 5. 최후 수단: 디바이스 UUID 직접 사용 (FK 제약 시 실패 가능)
  _cachedUserId = deviceId;
  console.warn('[Auth] auth 없이 디바이스 ID 직접 사용:', deviceId.slice(0, 8));
  return _cachedUserId;
}

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return crypto.randomUUID();
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function saveDeviceId(id: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
}

/**
 * 캐시 초기화 (로그아웃 시 호출)
 */
export function clearCachedUserId() {
  _cachedUserId = null;
}

/**
 * 외부에서 user_id 설정 (카카오 로그인 시 호출)
 */
export function setCachedUserId(id: string | null) {
  _cachedUserId = id;
}
