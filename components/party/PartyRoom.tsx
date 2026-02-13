'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { BrandIcon } from '@/components/subscription/BrandIcon';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Crown,
  Users,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Send,
  Lock,
  Globe,
  QrCode,
  Bell,
  Loader2,
  UserMinus,
  CheckCircle2,
  XCircle,
  Clock,
  Megaphone,
} from 'lucide-react';

interface PartyRoomProps {
  party: {
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
  };
  onBack: () => void;
}

interface PartyMessage {
  id: string;
  party_id: string;
  sender_id: string;
  sender_nickname: string;
  content: string;
  type: 'message' | 'notice' | 'system';
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
}

const CONTACT_LABELS: Record<string, string> = {
  kakao: '카카오톡 오픈채팅',
  discord: '디스코드',
  other: '기타',
};

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

export function PartyRoom({ party, onBack }: PartyRoomProps) {
  const { user, profile } = useAuth();
  const isOwner = party.role === 'owner';

  // Messages
  const [messages, setMessages] = useState<PartyMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Members (accepted applications)
  const [members, setMembers] = useState<PartyApplication[]>([]);

  // Notice
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const [noticeText, setNoticeText] = useState('');

  // QR Dialog
  const [showQrDialog, setShowQrDialog] = useState(false);

  // Manage applications
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [pendingApps, setPendingApps] = useState<PartyApplication[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Clipboard
  const [copiedField, setCopiedField] = useState('');

  // Live party data
  const [liveParty, setLiveParty] = useState(party);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('party_messages')
      .select('*')
      .eq('party_id', party.id)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setMessages(data as PartyMessage[]);
  }, [party.id]);

  // Fetch accepted members
  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from('party_applications')
      .select('*')
      .eq('post_id', party.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: true });
    if (data) setMembers(data as PartyApplication[]);
  }, [party.id]);

  // Fetch pending apps (for owner)
  const fetchPendingApps = useCallback(async () => {
    const { data } = await supabase
      .from('party_applications')
      .select('*')
      .eq('post_id', party.id)
      .order('created_at', { ascending: true });
    if (data) setPendingApps(data as PartyApplication[]);
  }, [party.id]);

  // Refresh party data
  const refreshParty = useCallback(async () => {
    const { data } = await supabase
      .from('public_party_posts')
      .select('*')
      .eq('id', party.id)
      .single();
    if (data) setLiveParty({ ...data, role: party.role });
  }, [party.id, party.role]);

  useEffect(() => {
    fetchMessages();
    fetchMembers();
    if (isOwner) fetchPendingApps();

    const channel = supabase
      .channel(`party-room-${party.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'party_messages', filter: `party_id=eq.${party.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as PartyMessage]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_applications', filter: `post_id=eq.${party.id}` }, () => {
        fetchMembers();
        if (isOwner) fetchPendingApps();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'public_party_posts', filter: `id=eq.${party.id}` }, () => {
        refreshParty();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [party.id, isOwner, fetchMessages, fetchMembers, fetchPendingApps, refreshParty]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !profile) return;
    setSending(true);

    await supabase.from('party_messages').insert({
      party_id: party.id,
      sender_id: user.id,
      sender_nickname: profile.nickname,
      content: newMessage.trim(),
      type: 'message',
    });

    setNewMessage('');
    setSending(false);
  };

  // Send notice
  const handleSendNotice = async () => {
    if (!noticeText.trim() || !user || !profile) return;

    await supabase.from('party_messages').insert({
      party_id: party.id,
      sender_id: user.id,
      sender_nickname: profile.nickname,
      content: noticeText.trim(),
      type: 'notice',
    });

    setNoticeText('');
    setShowNoticeDialog(false);
  };

  // Accept application
  const handleAccept = async (app: PartyApplication) => {
    setSubmitting(true);
    await supabase
      .from('party_applications')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', app.id);

    const newCount = liveParty.current_members + 1;
    const updateData: Record<string, unknown> = { current_members: newCount };
    if (newCount >= liveParty.max_members) updateData.status = 'closed';

    await supabase.from('public_party_posts').update(updateData).eq('id', party.id);

    // System message
    await supabase.from('party_messages').insert({
      party_id: party.id,
      sender_id: user!.id,
      sender_nickname: profile!.nickname,
      content: `${app.applicant_nickname}님이 파티에 참가했습니다!`,
      type: 'system',
    });

    await fetchPendingApps();
    await refreshParty();
    setSubmitting(false);
  };

  // Reject application
  const handleReject = async (app: PartyApplication) => {
    setSubmitting(true);
    await supabase
      .from('party_applications')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', app.id);
    await fetchPendingApps();
    setSubmitting(false);
  };

  const latestNotice = [...messages].reverse().find(m => m.type === 'notice');
  const pendingCount = pendingApps.filter(a => a.status === 'pending').length;
  const qrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/party?code=${liveParty.invite_code}`
    : '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <BrandIcon name={liveParty.service_name} icon={liveParty.service_icon} size="sm" />
          </div>
          <div>
            <h2 className="font-bold text-lg">{liveParty.service_name} 파티</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Crown className="h-3 w-3" />
              {liveParty.author_nickname}
            </div>
          </div>
        </div>
        <Badge
          variant={liveParty.status === 'recruiting' ? 'default' : 'secondary'}
          className="rounded-full"
        >
          {liveParty.status === 'recruiting' ? '모집 중' : '마감'}
        </Badge>
      </div>

      {/* Party Info Card */}
      <Card className="rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-accent rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">인원</p>
              <p className="font-bold">
                <Users className="inline h-4 w-4 mr-1" />
                {liveParty.current_members}/{liveParty.max_members}
              </p>
            </div>
            <div className="bg-accent rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">1인당 월</p>
              <p className="font-bold text-primary">{formatKRW(liveParty.price_per_member)}</p>
            </div>
            <div className="bg-accent rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">공개</p>
              <p className="font-bold flex items-center justify-center gap-1">
                {liveParty.visibility === 'private' ? (
                  <><Lock className="h-3.5 w-3.5" /> 비공개</>
                ) : (
                  <><Globe className="h-3.5 w-3.5" /> 공개</>
                )}
              </p>
            </div>
          </div>

          {/* Invite Code */}
          <div className="flex items-center justify-between bg-accent rounded-xl px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">초대 코드</p>
              <p className="font-mono font-bold text-lg tracking-wider">{liveParty.invite_code}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg"
                onClick={() => handleCopy(liveParty.invite_code, 'code')}
              >
                {copiedField === 'code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg"
                onClick={() => setShowQrDialog(true)}
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card className="rounded-2xl">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              멤버 ({liveParty.current_members}/{liveParty.max_members})
            </h3>
            {isOwner && pendingCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg text-xs"
                onClick={() => setShowManageDialog(true)}
              >
                <Bell className="mr-1 h-3 w-3" />
                신청 {pendingCount}건
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {/* Owner */}
            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-4 py-2.5">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-sm">{liveParty.author_nickname}</span>
              <Badge className="ml-auto rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                파티장
              </Badge>
            </div>

            {/* Accepted members */}
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 bg-accent rounded-xl px-4 py-2.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{m.applicant_nickname}</span>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: liveParty.max_members - liveParty.current_members }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 border border-dashed rounded-xl px-4 py-2.5">
                <UserMinus className="h-4 w-4 text-muted-foreground/40" />
                <span className="text-sm text-muted-foreground/40">빈 슬롯</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notice */}
      {(latestNotice || isOwner) && (
        <Card className="rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                공지
              </h3>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg text-xs"
                  onClick={() => setShowNoticeDialog(true)}
                >
                  공지 작성
                </Button>
              )}
            </div>
            {latestNotice ? (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                <p className="text-sm">{latestNotice.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {latestNotice.sender_nickname} · {formatRelativeDate(latestNotice.created_at)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                아직 공지가 없습니다
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chatroom Info */}
      <Card className="rounded-2xl">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <MessageCircle className="h-4 w-4" />
            채팅방 정보
          </h3>
          <div className="border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {CONTACT_LABELS[liveParty.contact_type] || '연락처'}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 rounded-lg"
                    onClick={() => handleCopy(liveParty.contact_link, 'link')}
                  >
                    {copiedField === 'link' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  {liveParty.contact_link.startsWith('http') && (
                    <a href={liveParty.contact_link} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="h-7 px-2 rounded-lg">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
              <p className="text-sm font-mono bg-background rounded-lg px-3 py-2 break-all">
                {liveParty.contact_link}
              </p>
            </div>

            {liveParty.chatroom_code && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">입장 코드</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 rounded-lg"
                    onClick={() => handleCopy(liveParty.chatroom_code, 'chatcode')}
                  >
                    {copiedField === 'chatcode' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <p className="text-sm font-mono bg-background rounded-lg px-3 py-2 font-bold tracking-wider text-center text-lg">
                  {liveParty.chatroom_code}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Message Board */}
      <Card className="rounded-2xl">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            메시지 보드
          </h3>

          <div className="border rounded-xl overflow-hidden">
            <div className="h-64 overflow-y-auto p-4 space-y-3 bg-accent/30">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  아직 메시지가 없습니다. 첫 메시지를 보내보세요!
                </p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id}>
                    {msg.type === 'system' ? (
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground bg-accent rounded-full px-3 py-1">
                          {msg.content}
                        </span>
                      </div>
                    ) : msg.type === 'notice' ? (
                      <div className="bg-primary/5 border border-primary/10 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                          <Megaphone className="h-3 w-3" />
                          공지
                        </div>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeDate(msg.created_at)}
                        </p>
                      </div>
                    ) : msg.sender_id === user?.id ? (
                      <div className="flex justify-end">
                        <div className="max-w-[75%]">
                          <p className="text-xs text-muted-foreground text-right mb-1">나</p>
                          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2">
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground text-right mt-1">
                            {formatRelativeDate(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className="max-w-[75%]">
                          <p className="text-xs text-muted-foreground mb-1">
                            {msg.sender_nickname}
                          </p>
                          <div className="bg-accent rounded-2xl rounded-tl-sm px-4 py-2">
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeDate(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 p-3 bg-background border-t">
              <Input
                placeholder="메시지 입력..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                className="rounded-xl flex-1"
                disabled={sending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                size="sm"
                className="rounded-xl px-4"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">QR 코드로 초대</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="bg-white p-4 rounded-2xl">
              <QRCodeSVG value={qrUrl} size={200} level="M" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                스마트폰 카메라로 QR 코드를 스캔하세요
              </p>
              <div className="flex items-center gap-2 justify-center">
                <span className="font-mono font-bold text-2xl tracking-wider">
                  {liveParty.invite_code}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => handleCopy(liveParty.invite_code, 'qr-code')}
                >
                  {copiedField === 'qr-code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => {
                const shareText = `${liveParty.service_name} 파티에 참가하세요!\n초대 코드: ${liveParty.invite_code}\n${qrUrl}`;
                handleCopy(shareText, 'share');
              }}
            >
              {copiedField === 'share' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              초대 메시지 복사
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notice Dialog */}
      <Dialog open={showNoticeDialog} onOpenChange={setShowNoticeDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">공지 작성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              placeholder="파티원들에게 전할 공지사항을 작성하세요 (결제일, 규칙 등)"
              value={noticeText}
              onChange={e => setNoticeText(e.target.value)}
              className="rounded-xl resize-none"
              rows={4}
            />
            <Button
              onClick={handleSendNotice}
              disabled={!noticeText.trim()}
              className="w-full rounded-xl font-semibold"
            >
              <Megaphone className="mr-2 h-4 w-4" />
              공지 등록
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Applications Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              신청 관리
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Pending */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                대기 중 ({pendingApps.filter(a => a.status === 'pending').length})
              </h3>
              {pendingApps.filter(a => a.status === 'pending').length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  대기 중인 신청이 없습니다
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingApps.filter(a => a.status === 'pending').map(app => (
                    <Card key={app.id} className="rounded-xl">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <p className="font-semibold">{app.applicant_nickname}</p>
                          <p className="text-xs text-muted-foreground">{formatRelativeDate(app.created_at)}</p>
                        </div>
                        {app.message && (
                          <p className="text-sm bg-accent rounded-lg p-3">{app.message}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleAccept(app)}
                            disabled={submitting || liveParty.current_members >= liveParty.max_members}
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            수락
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 rounded-lg font-semibold text-destructive"
                            onClick={() => handleReject(app)}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
