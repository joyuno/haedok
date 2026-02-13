'use client';

import { useState, useEffect } from 'react';
import { LogOut, UserX, UserCog, MessageCircle, Pencil, Check, X, FlaskConical, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function TopBar() {
  const { user, profile, signInWithKakao, signOut, updateNickname, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const handleStartEdit = () => {
    setNicknameInput(profile?.nickname || '');
    setIsEditingNickname(true);
  };

  const handleSaveNickname = async () => {
    const trimmed = nicknameInput.trim();
    if (trimmed && trimmed !== profile?.nickname) {
      await updateNickname(trimmed);
    }
    setIsEditingNickname(false);
  };

  const handleCancelEdit = () => {
    setIsEditingNickname(false);
    setNicknameInput('');
  };

  const handleDeleteAccount = async () => {
    const success = await deleteAccount();
    if (success) {
      setShowDeleteConfirm(false);
      setShowProfileDialog(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-background/80 backdrop-blur-sm border-b border-border/50">
        {/* Logo - mobile only (desktop has Sidebar) */}
        <div className="flex items-center gap-2 lg:hidden">
          <FlaskConical className="w-5 h-5 text-emerald-500" aria-hidden="true" />
          <span className="font-bold text-lg">해<span className="text-emerald-500">독</span></span>
        </div>
        <div className="hidden lg:block" />

        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={mounted && theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className="p-2 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            {mounted && theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Auth */}
          {user && profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-accent transition-all outline-none">
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  {profile.nickname}
                </span>
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.nickname}
                    className="w-8 h-8 rounded-full ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary ring-2 ring-primary/20">
                    {profile.nickname[0]}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold">{profile.nickname}</p>
                  <p className="text-xs text-muted-foreground">카카오 계정</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setShowProfileDialog(true)}>
                  <UserCog className="w-4 h-4" />
                  <span>내 정보</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => signOut()}>
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setShowDeleteConfirm(true)}
              >
                <UserX className="w-4 h-4" />
                <span>회원 탈퇴</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={signInWithKakao}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FEE500] text-[#3C1E1E] text-sm font-semibold hover:bg-[#FDD835] transition-all shadow-sm hover:shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span>카카오 로그인</span>
          </button>
        )}
        </div>
      </div>

      {/* 내 정보 Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={(open) => {
        setShowProfileDialog(open);
        if (!open) {
          setIsEditingNickname(false);
        }
      }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">내 정보</DialogTitle>
          </DialogHeader>
          {user && profile && (
            <div className="space-y-5 pt-2">
              {/* 프로필 이미지 */}
              <div className="flex justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full ring-4 ring-primary/10" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary ring-4 ring-primary/10">
                    {profile.nickname[0]}
                  </div>
                )}
              </div>

              {/* 닉네임 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">닉네임</label>
                {isEditingNickname ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      maxLength={20}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNickname();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      onClick={handleSaveNickname}
                      className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 rounded-lg bg-accent text-muted-foreground hover:bg-accent/80 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-accent/50">
                    <span className="text-sm font-medium">{profile.nickname}</span>
                    <button
                      onClick={handleStartEdit}
                      className="p-1.5 rounded-md hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* 로그인 방식 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">로그인 방식</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/50">
                  <MessageCircle className="w-4 h-4 text-[#FEE500]" />
                  <span className="text-sm">카카오 계정</span>
                </div>
              </div>

              {/* 가입일 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">가입일</label>
                <div className="px-3 py-2 rounded-lg bg-accent/50">
                  <span className="text-sm">
                    {new Date(user.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 회원 탈퇴 확인 Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive">회원 탈퇴</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-destructive/10 rounded-xl p-4">
              <p className="text-sm text-destructive font-medium leading-relaxed">
                탈퇴하시면 모든 구독 데이터, 파티 정보, 이용 기록이
                영구적으로 삭제되며 복구할 수 없습니다.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-accent text-foreground text-sm font-semibold hover:bg-accent/80 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-all"
              >
                탈퇴하기
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
