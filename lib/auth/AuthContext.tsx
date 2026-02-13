'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { setCachedUserId, clearCachedUserId } from '@/lib/auth/ensureUserId';

interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithKakao: () => Promise<void>;
  signOut: () => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
  deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setCachedUserId(session.user.id);
        await fetchProfile(session.user.id);
      } else {
        // 세션이 없으면 익명 로그인으로 자동 생성
        try {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (!error && data?.user) {
            setUser(data.user);
            setCachedUserId(data.user.id);
            // 익명 사용자용 프로필 생성
            await supabase.from('profiles').upsert({
              id: data.user.id,
              nickname: `사용자_${data.user.id.slice(0, 6)}`,
            }, { onConflict: 'id' });
            await fetchProfile(data.user.id);
          }
        } catch (e) {
          console.error('[Auth] 익명 로그인 실패:', e);
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setCachedUserId(session.user.id);
          await fetchProfile(session.user.id);
        } else {
          clearCachedUserId();
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signInWithKakao = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: typeof window !== 'undefined'
          ? window.location.origin + '/party'
          : undefined,
      },
    });
    if (error) {
      console.error('카카오 로그인 오류:', error.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearCachedUserId();
    setUser(null);
    setProfile(null);
  }, []);

  const updateNickname = useCallback(async (nickname: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ nickname })
      .eq('id', user.id);
    if (!error) {
      setProfile(prev => prev ? { ...prev, nickname } : null);
    }
  }, [user]);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    // FK CASCADE가 설정되어 있어 profiles 삭제 시 연관 데이터 자동 삭제:
    // profiles → subscriptions, usage_records, public_party_posts, party_applications, party_messages
    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
    if (error) {
      console.error('[Supabase] 회원 탈퇴 실패:', error.message);
      return false;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    return true;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithKakao, signOut, updateNickname, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
