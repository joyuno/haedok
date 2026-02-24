'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BrandIcon } from '@/components/subscription/BrandIcon';
import { SERVICE_PRESETS } from '@/lib/constants/servicePresets';
import { formatKRW } from '@/lib/utils/formatCurrency';
import {
  Plus, Users, Clock, Megaphone, RefreshCw, Loader2,
  UserPlus, Check, X, Copy, ExternalLink,
  MessageCircle, LogIn, Crown, Bell, CheckCircle2, XCircle,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

interface PublicPartyPost {
  id: string;
  service_name: string;
  service_icon: string;
  current_members: number;
  max_members: number;
  price_per_member: number;
  total_price: number;
  status: 'recruiting' | 'closed';
  comment: string;
  author_id: string;
  author_nickname: string;
  chatroom_code: string;
  contact_type: 'kakao' | 'discord' | 'other';
  contact_link: string;
  created_at: string;
}

interface PartyApplication {
  id: string;
  post_id: string;
  applicant_id: string;
  applicant_nickname: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  responded_at: string | null;
}

// ── Helpers ────────────────────────────────────────────────────

const CONTACT_LABELS: Record<string, string> = {
  kakao: '카카오톡 오픈채팅',
  discord: '디스코드',
  other: '기타',
};

const familyServices = Object.values(SERVICE_PRESETS).filter(s => s.familyPlan);

function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

// ── Component ──────────────────────────────────────────────────

export function PublicPartyBoard() {
  const { user, profile, loading: authLoading, isAnonymous } = useAuth();

  // Data
  const [posts, setPosts] = useState<PublicPartyPost[]>([]);
  const [myApplications, setMyApplications] = useState<PartyApplication[]>([]);
  const [pendingApps, setPendingApps] = useState<PartyApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PublicPartyPost | null>(null);

  // Create form
  const [newService, setNewService] = useState('');
  const [newMaxMembers, setNewMaxMembers] = useState('4');
  const [newComment, setNewComment] = useState('');
  const [newContactType, setNewContactType] = useState<'kakao' | 'discord' | 'other'>('kakao');
  const [newContactLink, setNewContactLink] = useState('');
  const [newChatroomCode, setNewChatroomCode] = useState('');

  // Apply form
  const [applyMessage, setApplyMessage] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Data Fetching ──────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('public_party_posts')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setPosts(data as PublicPartyPost[]);
      }
    } catch (e) {
      console.error('[PublicPartyBoard] 게시글 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyApplications = useCallback(async () => {
    if (!user || isAnonymous) { setMyApplications([]); return; }
    try {
      const { data } = await supabase
        .from('party_applications')
        .select('*')
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setMyApplications(data as PartyApplication[]);
    } catch (e) {
      console.error('[PublicPartyBoard] 내 신청 로드 실패:', e);
    }
  }, [user]);

  const fetchPendingAppsForPost = useCallback(async (postId: string) => {
    const { data } = await supabase
      .from('party_applications')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (data) setPendingApps(data as PartyApplication[]);
  }, []);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('public-party-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'public_party_posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_applications' }, () => {
        fetchMyApplications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts, fetchMyApplications]);

  useEffect(() => {
    fetchMyApplications();
  }, [fetchMyApplications]);

  // ── Helpers ────────────────────────────────────────────────

  const isMyPost = (post: PublicPartyPost) => user && post.author_id === user.id;

  const getMyApplication = (postId: string) =>
    myApplications.find(a => a.post_id === postId);

  // ── Actions ────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!user || !profile || !newService) return;
    setSubmitting(true);

    const preset = SERVICE_PRESETS[newService];
    const maxMembers = parseInt(newMaxMembers, 10);
    const totalPrice = preset.familyPlan?.price ?? 0;
    const pricePerMember = Math.round(totalPrice / maxMembers);

    const { error } = await supabase.from('public_party_posts').insert({
      service_name: preset.name,
      service_icon: preset.icon,
      max_members: maxMembers,
      current_members: 1,
      total_price: totalPrice,
      price_per_member: pricePerMember,
      status: 'recruiting',
      comment: newComment,
      author_id: user.id,
      author_nickname: profile.nickname,
      contact_type: newContactType,
      contact_link: newContactLink,
      chatroom_code: newChatroomCode,
    });

    if (!error) {
      setShowCreateDialog(false);
      resetCreateForm();
      await fetchPosts();
    }
    setSubmitting(false);
  };

  const handleApply = async () => {
    if (!user || !profile || !selectedPost) return;
    setSubmitting(true);

    const { error } = await supabase.from('party_applications').insert({
      post_id: selectedPost.id,
      applicant_id: user.id,
      applicant_nickname: profile.nickname,
      message: applyMessage,
      status: 'pending',
    });

    if (!error) {
      setShowApplyDialog(false);
      setApplyMessage('');
      await fetchMyApplications();
    }
    setSubmitting(false);
  };

  const handleAcceptApplication = async (app: PartyApplication) => {
    if (!selectedPost) return;
    setSubmitting(true);

    await supabase
      .from('party_applications')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', app.id);

    const newCount = selectedPost.current_members + 1;
    const updateData: Record<string, unknown> = { current_members: newCount };
    if (newCount >= selectedPost.max_members) {
      updateData.status = 'closed';
    }
    await supabase
      .from('public_party_posts')
      .update(updateData)
      .eq('id', selectedPost.id);

    await fetchPosts();
    await fetchPendingAppsForPost(selectedPost.id);
    setSelectedPost(prev => prev ? { ...prev, current_members: newCount, status: newCount >= selectedPost.max_members ? 'closed' : prev.status } : null);
    setSubmitting(false);
  };

  const handleRejectApplication = async (app: PartyApplication) => {
    setSubmitting(true);
    await supabase
      .from('party_applications')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', app.id);

    if (selectedPost) await fetchPendingAppsForPost(selectedPost.id);
    setSubmitting(false);
  };

  const handleClosePost = async (post: PublicPartyPost) => {
    await supabase
      .from('public_party_posts')
      .update({ status: 'closed' })
      .eq('id', post.id);
    await fetchPosts();
  };

  const handleDeletePost = async (post: PublicPartyPost) => {
    await supabase
      .from('public_party_posts')
      .delete()
      .eq('id', post.id);
    setShowDetailDialog(false);
    setShowManageDialog(false);
    await fetchPosts();
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetCreateForm = () => {
    setNewService('');
    setNewMaxMembers('4');
    setNewComment('');
    setNewContactType('kakao');
    setNewContactLink('');
    setNewChatroomCode('');
  };

  const openManageDialog = async (post: PublicPartyPost) => {
    setSelectedPost(post);
    await fetchPendingAppsForPost(post.id);
    setShowManageDialog(true);
  };

  const openApplyDialog = (post: PublicPartyPost) => {
    setSelectedPost(post);
    setApplyMessage('');
    setShowApplyDialog(true);
  };

  const openDetailDialog = (post: PublicPartyPost) => {
    setSelectedPost(post);
    setShowDetailDialog(true);
  };

  // ── Render ─────────────────────────────────────────────────

  const selectedPreset = newService ? SERVICE_PRESETS[newService] : null;
  const recruitingPosts = posts.filter(p => p.status === 'recruiting');

  // 공개 게시판: 게시글 로딩만 체크 (인증 대기 불필요)
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">공개 모집 게시판</h2>
          <Badge variant="secondary" className="rounded-full">
            {recruitingPosts.length}건 모집 중
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchPosts} className="rounded-lg">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {user && (
            <Button onClick={() => setShowCreateDialog(true)} size="sm" className="rounded-lg font-semibold">
              <Plus className="mr-1.5 h-4 w-4" />
              모집글 작성
            </Button>
          )}
        </div>
      </div>

      {/* Login Prompt */}
      {!user && (
        <Card className="rounded-2xl border-dashed border-2 border-primary/20">
          <CardContent className="py-6 text-center">
            <LogIn className="h-10 w-10 mx-auto text-primary/40 mb-3" />
            <p className="text-muted-foreground font-medium">
              우측 상단의 카카오 로그인 후 파티에 가입 신청하거나 모집글을 작성할 수 있어요
            </p>
          </CardContent>
        </Card>
      )}

      {/* User Info Bar */}
      {user && profile && (
        <Card className="rounded-2xl">
          <CardContent className="py-3 px-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {profile.nickname[0]}
                </div>
              )}
              <span className="font-semibold text-sm">{profile.nickname}</span>
              {myApplications.filter(a => a.status === 'accepted').length > 0 && (
                <Badge variant="secondary" className="rounded-full text-xs">
                  {myApplications.filter(a => a.status === 'accepted').length}개 파티 참여 중
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post List */}
      {recruitingPosts.length === 0 && posts.filter(p => p.status === 'closed').length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-16 text-center">
            <Megaphone className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="text-xl font-bold mb-2">아직 모집글이 없어요</h3>
            <p className="text-muted-foreground">
              첫 번째 파티를 만들어보세요!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {posts.map(post => {
            const myApp = getMyApplication(post.id);
            const isMine = isMyPost(post);
            const isClosed = post.status === 'closed';
            const isAccepted = myApp?.status === 'accepted';

            return (
              <Card key={post.id} className={`rounded-2xl transition-all hover:shadow-md ${isClosed ? 'opacity-60' : ''}`}>
                <CardContent className="p-5 space-y-4">
                  {/* Service Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center">
                        <BrandIcon name={post.service_name} icon={post.service_icon} size="md" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base">{post.service_name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Crown className="h-3 w-3" />
                          <span>{post.author_nickname}</span>
                          <span className="mx-1">·</span>
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeDate(post.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={isClosed ? 'secondary' : 'default'} className="rounded-full text-xs">
                      {isClosed ? '마감' : '모집 중'}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-accent rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">모집 현황</p>
                      <p className="font-bold text-lg">
                        <Users className="inline h-4 w-4 mr-1" />
                        {post.current_members}/{post.max_members}
                      </p>
                    </div>
                    <div className="bg-accent rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">1인당 월</p>
                      <p className="font-bold text-lg text-primary">{formatKRW(post.price_per_member)}</p>
                    </div>
                  </div>

                  {/* Comment */}
                  {post.comment && (
                    <p className="text-sm text-muted-foreground bg-accent/50 rounded-xl p-3 line-clamp-2">
                      {post.comment}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {isMine ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-xl font-semibold"
                          onClick={() => openManageDialog(post)}
                        >
                          <Bell className="mr-1.5 h-3.5 w-3.5" />
                          신청 관리
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => openDetailDialog(post)}
                        >
                          상세
                        </Button>
                      </>
                    ) : !user ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-xl"
                        disabled
                      >
                        <LogIn className="mr-1.5 h-3.5 w-3.5" />
                        로그인 필요
                      </Button>
                    ) : myApp?.status === 'pending' ? (
                      <Button variant="secondary" size="sm" className="flex-1 rounded-xl" disabled>
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        신청 대기 중
                      </Button>
                    ) : isAccepted ? (
                      <Button
                        size="sm"
                        className="flex-1 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => openDetailDialog(post)}
                      >
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        수락됨 - 채팅방 입장
                      </Button>
                    ) : myApp?.status === 'rejected' ? (
                      <Button variant="secondary" size="sm" className="flex-1 rounded-xl text-destructive" disabled>
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        거절됨
                      </Button>
                    ) : isClosed ? (
                      <Button variant="secondary" size="sm" className="flex-1 rounded-xl" disabled>
                        모집 마감
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1 rounded-xl font-semibold"
                        onClick={() => openApplyDialog(post)}
                      >
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                        가입 신청
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create Post Dialog ──────────────────────────────────── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">파티 모집글 작성</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="font-semibold">구독 서비스</Label>
              <Select value={newService} onValueChange={setNewService}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="서비스 선택" />
                </SelectTrigger>
                <SelectContent>
                  {familyServices.map(s => (
                    <SelectItem key={s.name} value={s.name}>
                      <span className="flex items-center gap-2">
                        <BrandIcon name={s.name} icon={s.icon} size="sm" />
                        {s.name}
                        {s.familyPlan && <span className="text-xs text-muted-foreground ml-1">(최대 {s.familyPlan.maxMembers}인)</span>}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPreset?.familyPlan && (
              <div className="bg-accent rounded-xl p-4 text-sm space-y-1">
                <p><strong>{selectedPreset.familyPlan.name}</strong> 요금제: {formatKRW(selectedPreset.familyPlan.price)}/월</p>
                <p className="text-muted-foreground">최대 {selectedPreset.familyPlan.maxMembers}인 공유 가능</p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="font-semibold">모집 인원 (본인 포함)</Label>
              <Select value={newMaxMembers} onValueChange={setNewMaxMembers}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map(n => (
                    <SelectItem key={n} value={String(n)}>{n}명</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPreset?.familyPlan && (
                <p className="text-xs text-muted-foreground">
                  1인당 예상 비용: {formatKRW(Math.round(selectedPreset.familyPlan.price / parseInt(newMaxMembers, 10)))}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">연락 방법</Label>
              <Select value={newContactType} onValueChange={(v) => setNewContactType(v as 'kakao' | 'discord' | 'other')}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kakao">카카오톡 오픈채팅</SelectItem>
                  <SelectItem value="discord">디스코드</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">
                {newContactType === 'kakao' ? '오픈채팅 링크' : newContactType === 'discord' ? '디스코드 초대 링크' : '연락처 링크'}
              </Label>
              <Input
                placeholder={newContactType === 'kakao' ? 'https://open.kakao.com/o/...' : 'https://...'}
                value={newContactLink}
                onChange={e => setNewContactLink(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">수락된 멤버에게만 공개됩니다</p>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">채팅방 입장 코드 (선택)</Label>
              <Input
                placeholder="오픈채팅방 비밀번호가 있다면 입력"
                value={newChatroomCode}
                onChange={e => setNewChatroomCode(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">수락된 멤버에게만 공개됩니다</p>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">모집 코멘트</Label>
              <Textarea
                placeholder="파티 소개, 규칙, 결제일 등을 알려주세요"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={!newService || !newContactLink || submitting}
              className="w-full rounded-xl font-semibold"
              size="lg"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              모집글 등록
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Apply Dialog ────────────────────────────────────────── */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">가입 신청</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-5 pt-2">
              <div className="flex items-center gap-3 bg-accent rounded-xl p-4">
                <BrandIcon name={selectedPost.service_name} icon={selectedPost.service_icon} size="lg" />
                <div>
                  <p className="font-bold">{selectedPost.service_name}</p>
                  <p className="text-sm text-muted-foreground">
                    파티장: {selectedPost.author_nickname} · {selectedPost.current_members}/{selectedPost.max_members}명
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">신청 메시지</Label>
                <Textarea
                  placeholder="파티장에게 보낼 자기소개나 메시지를 입력하세요"
                  value={applyMessage}
                  onChange={e => setApplyMessage(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={4}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                파티장이 신청을 수락하면 채팅방 링크와 입장 코드를 확인할 수 있습니다.
              </p>

              <Button
                onClick={handleApply}
                disabled={submitting}
                className="w-full rounded-xl font-semibold"
                size="lg"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                가입 신청하기
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Manage Applications Dialog (for author) ─────────────── */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              신청 관리
            </DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4 pt-2">
              <div className="bg-accent rounded-xl p-4">
                <p className="font-bold">{selectedPost.service_name}</p>
                <p className="text-sm text-muted-foreground">
                  현재 {selectedPost.current_members}/{selectedPost.max_members}명
                </p>
              </div>

              {/* Pending */}
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  대기 중 ({pendingApps.filter(a => a.status === 'pending').length})
                </h3>
                {pendingApps.filter(a => a.status === 'pending').length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">대기 중인 신청이 없습니다</p>
                ) : (
                  <div className="space-y-3">
                    {pendingApps.filter(a => a.status === 'pending').map(app => (
                      <Card key={app.id} className="rounded-xl">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{app.applicant_nickname}</p>
                              <p className="text-xs text-muted-foreground">{formatRelativeDate(app.created_at)}</p>
                            </div>
                          </div>
                          {app.message && (
                            <p className="text-sm bg-accent rounded-lg p-3">{app.message}</p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleAcceptApplication(app)}
                              disabled={submitting || selectedPost.current_members >= selectedPost.max_members}
                            >
                              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              수락
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-lg font-semibold text-destructive"
                              onClick={() => handleRejectApplication(app)}
                              disabled={submitting}
                            >
                              <XCircle className="mr-1.5 h-3.5 w-3.5" />
                              거절
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Accepted */}
              {pendingApps.filter(a => a.status === 'accepted').length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    수락됨 ({pendingApps.filter(a => a.status === 'accepted').length})
                  </h3>
                  <div className="space-y-2">
                    {pendingApps.filter(a => a.status === 'accepted').map(app => (
                      <div key={app.id} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 rounded-xl px-4 py-3">
                        <span className="font-medium text-sm">{app.applicant_nickname}</span>
                        <Badge variant="secondary" className="rounded-full text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                          수락됨
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejected */}
              {pendingApps.filter(a => a.status === 'rejected').length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    거절됨 ({pendingApps.filter(a => a.status === 'rejected').length})
                  </h3>
                  <div className="space-y-2">
                    {pendingApps.filter(a => a.status === 'rejected').map(app => (
                      <div key={app.id} className="flex items-center justify-between bg-accent rounded-xl px-4 py-3">
                        <span className="font-medium text-sm text-muted-foreground">{app.applicant_nickname}</span>
                        <Badge variant="secondary" className="rounded-full text-xs">거절됨</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Post Actions */}
              <div className="border-t pt-4 space-y-2">
                {selectedPost.status === 'recruiting' && (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => handleClosePost(selectedPost)}
                  >
                    모집 마감하기
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full rounded-xl text-destructive hover:text-destructive"
                  onClick={() => handleDeletePost(selectedPost)}
                >
                  게시글 삭제
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog (accepted member / author) ────────────── */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">파티 상세</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-5 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <BrandIcon name={selectedPost.service_name} icon={selectedPost.service_icon} size="lg" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedPost.service_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    파티장: {selectedPost.author_nickname} · {selectedPost.current_members}/{selectedPost.max_members}명
                  </p>
                </div>
              </div>

              {selectedPost.comment && (
                <div className="bg-accent rounded-xl p-4">
                  <p className="text-sm">{selectedPost.comment}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-accent rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">총 비용</p>
                  <p className="font-bold">{formatKRW(selectedPost.total_price)}/월</p>
                </div>
                <div className="bg-accent rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">1인당</p>
                  <p className="font-bold text-primary">{formatKRW(selectedPost.price_per_member)}/월</p>
                </div>
              </div>

              {/* Chatroom Info - only for author or accepted members */}
              {(isMyPost(selectedPost) || getMyApplication(selectedPost.id)?.status === 'accepted') && (
                <div className="border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <MessageCircle className="h-4 w-4" />
                    채팅방 정보
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {CONTACT_LABELS[selectedPost.contact_type] || '연락처'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 rounded-lg"
                          onClick={() => handleCopy(selectedPost.contact_link)}
                        >
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        {selectedPost.contact_link.startsWith('http') && (
                          <a href={selectedPost.contact_link} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-mono bg-background rounded-lg px-3 py-2 break-all">
                      {selectedPost.contact_link}
                    </p>
                  </div>

                  {selectedPost.chatroom_code && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">입장 코드</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 rounded-lg"
                          onClick={() => handleCopy(selectedPost.chatroom_code)}
                        >
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      <p className="text-sm font-mono bg-background rounded-lg px-3 py-2 font-bold tracking-wider text-center text-lg">
                        {selectedPost.chatroom_code}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Author actions */}
              {isMyPost(selectedPost) && (
                <div className="space-y-2 border-t pt-4">
                  {selectedPost.status === 'recruiting' && (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl"
                      onClick={() => handleClosePost(selectedPost)}
                    >
                      모집 마감하기
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full rounded-xl text-destructive hover:text-destructive"
                    onClick={() => handleDeletePost(selectedPost)}
                  >
                    게시글 삭제
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
