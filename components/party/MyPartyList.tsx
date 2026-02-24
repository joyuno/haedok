'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { BrandIcon } from '@/components/subscription/BrandIcon';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PartyPopper,
  Plus,
  LogIn,
  Users,
  Crown,
  Loader2,
  Lock,
  Globe,
  ChevronRight,
} from 'lucide-react';

interface MyParty {
  id: string;
  service_name: string;
  service_icon: string;
  current_members: number;
  max_members: number;
  price_per_member: number;
  total_price: number;
  status: string;
  comment: string;
  author_id: string;
  author_nickname: string;
  visibility: string;
  invite_code: string;
  contact_type: string;
  contact_link: string;
  chatroom_code: string;
  created_at: string;
  role: 'owner' | 'member';
}

interface MyPartyListProps {
  onCreateClick: () => void;
  onPartyClick: (party: MyParty) => void;
}

export type { MyParty };

export function MyPartyList({ onCreateClick, onPartyClick }: MyPartyListProps) {
  const { user, loading: authLoading, isAnonymous } = useAuth();
  const [parties, setParties] = useState<MyParty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyParties = useCallback(async () => {
    if (!user || isAnonymous) {
      setParties([]);
      setLoading(false);
      return;
    }

    try {
      // 1. Parties I created
      const { data: ownedPosts } = await supabase
        .from('public_party_posts')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      // 2. Parties where I was accepted
      const { data: acceptedApps } = await supabase
        .from('party_applications')
        .select('post_id')
        .eq('applicant_id', user.id)
        .eq('status', 'accepted');

      const acceptedPostIds = (acceptedApps || []).map(a => a.post_id);

      let memberPosts: typeof ownedPosts = [];
      if (acceptedPostIds.length > 0) {
        const { data } = await supabase
          .from('public_party_posts')
          .select('*')
          .in('id', acceptedPostIds)
          .order('created_at', { ascending: false });
        memberPosts = data || [];
      }

      // Combine and deduplicate
      const ownedIds = new Set((ownedPosts || []).map(p => p.id));
      const combined: MyParty[] = [
        ...(ownedPosts || []).map(p => ({ ...p, role: 'owner' as const })),
        ...(memberPosts || [])
          .filter(p => !ownedIds.has(p.id))
          .map(p => ({ ...p, role: 'member' as const })),
      ];

      setParties(combined);
    } catch (e) {
      console.error('[MyPartyList] 파티 목록 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  }, [user, isAnonymous]);

  useEffect(() => {
    if (authLoading) return;

    fetchMyParties();

    if (!user || isAnonymous) return;

    const channel = supabase
      .channel('my-parties-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'public_party_posts' }, () => fetchMyParties())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_applications' }, () => fetchMyParties())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMyParties, user, authLoading, isAnonymous]);

  // 인증 로딩 중이면 스피너 표시
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 비로그인 또는 익명 사용자면 로그인 안내 표시
  if (!user || isAnonymous) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-20 text-center">
          <LogIn className="h-20 w-20 mx-auto text-muted-foreground/30 mb-6" />
          <h3 className="text-2xl font-bold mb-3">로그인이 필요합니다</h3>
          <p className="text-muted-foreground mb-8 text-lg">
            파티 기능을 이용하려면 로그인해주세요
          </p>
          <p className="text-sm text-muted-foreground">
            우측 상단의 카카오 로그인 버튼을 눌러주세요
          </p>
        </CardContent>
      </Card>
    );
  }

  // 로그인된 사용자: 파티 데이터 로딩 중
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (parties.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="py-20 text-center">
          <PartyPopper className="h-20 w-20 mx-auto text-muted-foreground/30 mb-6" />
          <h3 className="text-2xl font-bold mb-3">아직 참여한 파티가 없어요</h3>
          <p className="text-muted-foreground mb-8 text-lg">
            새로운 파티를 만들거나 초대 코드로 참가해보세요
          </p>
          <div className="flex justify-center gap-3">
            <Button
              onClick={onCreateClick}
              className="rounded-xl font-semibold px-8 py-6 text-base"
            >
              <Plus className="mr-2 h-4 w-4" />
              파티 만들기
            </Button>
            <Button
              variant="outline"
              className="rounded-xl font-semibold px-8 py-6 text-base"
            >
              <LogIn className="mr-2 h-4 w-4" />
              초대 코드 참가
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {parties.map((party) => (
        <Card
          key={party.id}
          className={`rounded-2xl transition-all hover:shadow-md cursor-pointer group ${party.status === 'closed' ? 'opacity-60' : ''}`}
          onClick={() => onPartyClick(party)}
        >
          <CardContent className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center">
                  <BrandIcon name={party.service_name} icon={party.service_icon} size="sm" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{party.service_name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Crown className="h-3 w-3" />
                    <span>{party.author_nickname}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {party.visibility === 'private' ? (
                  <Badge variant="outline" className="rounded-full text-xs gap-1">
                    <Lock className="h-3 w-3" />
                    비공개
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-full text-xs gap-1">
                    <Globe className="h-3 w-3" />
                    공개
                  </Badge>
                )}
                {party.role === 'owner' && (
                  <Badge className="rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                    파티장
                  </Badge>
                )}
                {party.status === 'closed' && (
                  <Badge variant="secondary" className="rounded-full text-xs">
                    마감
                  </Badge>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-accent rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">인원</p>
                <p className="font-bold text-lg">
                  <Users className="inline h-4 w-4 mr-1" />
                  {party.current_members}/{party.max_members}
                </p>
              </div>
              <div className="bg-accent rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">1인당 월</p>
                <p className="font-bold text-lg text-primary">
                  {formatKRW(party.price_per_member)}
                </p>
              </div>
            </div>

            {/* Enter button */}
            <Button
              variant="ghost"
              className="w-full rounded-xl text-sm font-medium group-hover:bg-accent"
            >
              파티 룸 입장
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
