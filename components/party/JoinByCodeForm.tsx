'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { BrandIcon } from '@/components/subscription/BrandIcon';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  LogIn,
  Search,
  Loader2,
  UserPlus,
  Users,
  Crown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface FoundParty {
  id: string;
  service_name: string;
  service_icon: string;
  current_members: number;
  max_members: number;
  price_per_member: number;
  total_price: number;
  status: string;
  comment: string;
  author_nickname: string;
  visibility: string;
}

interface JoinByCodeFormProps {
  initialCode?: string;
}

export function JoinByCodeForm({ initialCode = '' }: JoinByCodeFormProps) {
  const { user, profile, signInWithKakao } = useAuth();

  const [code, setCode] = useState(initialCode);
  const [foundParty, setFoundParty] = useState<FoundParty | null>(null);
  const [searching, setSearching] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialCode) {
      handleSearch(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const handleSearch = async (searchCode?: string) => {
    const targetCode = (searchCode || code).trim().toUpperCase();
    if (!targetCode || targetCode.length < 4) {
      setError('초대 코드를 입력해주세요 (최소 4자)');
      return;
    }

    setSearching(true);
    setError('');
    setFoundParty(null);
    setApplied(false);

    const { data, error: fetchError } = await supabase
      .from('public_party_posts')
      .select('id, service_name, service_icon, current_members, max_members, price_per_member, total_price, status, comment, author_nickname, visibility')
      .eq('invite_code', targetCode)
      .single();

    if (fetchError || !data) {
      setError('해당 초대 코드의 파티를 찾을 수 없습니다');
    } else {
      setFoundParty(data as FoundParty);
    }
    setSearching(false);
  };

  const handleApply = async () => {
    if (!user || !profile || !foundParty) return;
    setSubmitting(true);

    const { error: insertError } = await supabase.from('party_applications').insert({
      post_id: foundParty.id,
      applicant_id: user.id,
      applicant_nickname: profile.nickname,
      message: applyMessage,
      status: 'pending',
    });

    if (!insertError) {
      setApplied(true);
      setApplyMessage('');
    } else {
      setError('신청 중 오류가 발생했습니다. 이미 신청한 파티인지 확인해주세요.');
    }
    setSubmitting(false);
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-8 space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-2">초대 코드로 참가하기</h3>
          <p className="text-base text-muted-foreground">
            친구에게 받은 초대 코드를 입력하거나 QR 코드를 스캔하세요
          </p>
        </div>

        {/* Code Input */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="invite-code" className="font-semibold">
              초대 코드
            </Label>
            <div className="flex gap-2">
              <Input
                id="invite-code"
                placeholder="예: ABC123"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                maxLength={6}
                className="font-mono text-lg tracking-wider rounded-xl flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={() => handleSearch()}
                disabled={searching || !code.trim()}
                className="rounded-xl px-6"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        {/* Found Party Preview */}
        {foundParty && !applied && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-3 bg-accent rounded-xl p-4">
              <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center">
                <BrandIcon name={foundParty.service_name} icon={foundParty.service_icon} size="sm" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold">{foundParty.service_name}</h4>
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {foundParty.visibility === 'private' ? '비공개' : '공개'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    {foundParty.author_nickname}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {foundParty.current_members}/{foundParty.max_members}명
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-accent rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">총 비용</p>
                <p className="font-bold">{formatKRW(foundParty.total_price)}/월</p>
              </div>
              <div className="bg-accent rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">1인당</p>
                <p className="font-bold text-primary">{formatKRW(foundParty.price_per_member)}/월</p>
              </div>
            </div>

            {foundParty.comment && (
              <p className="text-sm text-muted-foreground bg-accent/50 rounded-xl p-3">
                {foundParty.comment}
              </p>
            )}

            {foundParty.status !== 'recruiting' ? (
              <div className="text-center py-4 text-muted-foreground">
                이 파티는 현재 모집이 마감되었습니다
              </div>
            ) : !user ? (
              <Button
                onClick={signInWithKakao}
                className="w-full rounded-xl font-semibold bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD835]"
                size="lg"
              >
                <LogIn className="mr-2 h-4 w-4" />
                카카오 로그인 후 신청하기
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="font-semibold">신청 메시지 (선택)</Label>
                  <Textarea
                    placeholder="파티장에게 보낼 메시지를 입력하세요"
                    value={applyMessage}
                    onChange={e => setApplyMessage(e.target.value)}
                    className="rounded-xl resize-none"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleApply}
                  disabled={submitting}
                  className="w-full rounded-xl font-semibold"
                  size="lg"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  가입 신청하기
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Applied Success */}
        {applied && (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500" />
            <h4 className="text-lg font-bold">신청 완료!</h4>
            <p className="text-muted-foreground">
              파티장이 신청을 수락하면 &quot;내 파티&quot; 탭에서 확인할 수 있습니다
            </p>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setCode('');
                setFoundParty(null);
                setApplied(false);
              }}
            >
              다른 파티 찾기
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
