'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { MessageCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

export function SessionTimeoutDialog() {
  const { user, signOut, signInWithKakao } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loginTimeRef = useRef<number | null>(null);

  const handleTimeout = useCallback(async () => {
    await signOut();
    setShowDialog(true);
  }, [signOut]);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    loginTimeRef.current = Date.now();
    timerRef.current = setTimeout(handleTimeout, SESSION_TIMEOUT_MS);
  }, [handleTimeout]);

  useEffect(() => {
    if (user) {
      // Check if there's a stored login time
      const storedLoginTime = sessionStorage.getItem('haedok_login_time');
      if (storedLoginTime) {
        const elapsed = Date.now() - parseInt(storedLoginTime, 10);
        const remaining = SESSION_TIMEOUT_MS - elapsed;
        if (remaining <= 0) {
          handleTimeout();
          return;
        }
        loginTimeRef.current = parseInt(storedLoginTime, 10);
        timerRef.current = setTimeout(handleTimeout, remaining);
      } else {
        sessionStorage.setItem('haedok_login_time', Date.now().toString());
        startTimer();
      }
    } else {
      // User logged out, clear timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      sessionStorage.removeItem('haedok_login_time');
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user, handleTimeout, startTimer]);

  const handleRelogin = () => {
    setShowDialog(false);
    signInWithKakao();
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="max-w-sm rounded-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Clock className="w-5 h-5 text-amber-500" />
            세션 만료
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            보안을 위해 2시간이 경과하여 자동으로 로그아웃되었습니다.
            <br />
            계속 사용하시려면 다시 로그인해 주세요.
          </p>
          <button
            onClick={handleRelogin}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-[#FEE500] text-[#3C1E1E] font-semibold hover:bg-[#FDD835] transition-all shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>카카오 로그인</span>
          </button>
          <button
            onClick={() => setShowDialog(false)}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-accent transition-all font-medium"
          >
            나중에 하기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
