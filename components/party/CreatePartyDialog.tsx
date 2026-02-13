'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { SERVICE_PRESETS } from '@/lib/constants/servicePresets';
import { formatKRW } from '@/lib/utils/formatCurrency';
import { BrandIcon } from '@/components/subscription/BrandIcon';
import { Button } from '@/components/ui/button';
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
import { Plus, Loader2, Globe, Lock } from 'lucide-react';

const familyServices = Object.values(SERVICE_PRESETS).filter(s => s.familyPlan);

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

interface CreatePartyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreatePartyDialog({ open, onOpenChange, onCreated }: CreatePartyDialogProps) {
  const { user, profile } = useAuth();

  const [service, setService] = useState('');
  const [maxMembers, setMaxMembers] = useState('4');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [comment, setComment] = useState('');
  const [contactType, setContactType] = useState<'kakao' | 'discord' | 'other'>('kakao');
  const [contactLink, setContactLink] = useState('');
  const [chatroomCode, setChatroomCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedPreset = service ? SERVICE_PRESETS[service] : null;

  const resetForm = () => {
    setService('');
    setMaxMembers('4');
    setVisibility('public');
    setComment('');
    setContactType('kakao');
    setContactLink('');
    setChatroomCode('');
  };

  const handleCreate = async () => {
    if (!user || !profile || !service) return;
    setSubmitting(true);

    const preset = SERVICE_PRESETS[service];
    const max = parseInt(maxMembers, 10);
    const totalPrice = preset.familyPlan?.price ?? 0;
    const pricePerMember = Math.round(totalPrice / max);
    const inviteCode = generateInviteCode();

    const { error } = await supabase.from('public_party_posts').insert({
      service_name: preset.name,
      service_icon: preset.icon,
      max_members: max,
      current_members: 1,
      total_price: totalPrice,
      price_per_member: pricePerMember,
      status: 'recruiting',
      comment,
      author_id: user.id,
      author_nickname: profile.nickname,
      contact_type: contactType,
      contact_link: contactLink,
      chatroom_code: chatroomCode,
      visibility,
      invite_code: inviteCode,
    });

    if (!error) {
      resetForm();
      onOpenChange(false);
      onCreated?.();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">새 파티 만들기</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {/* Service */}
          <div className="space-y-2">
            <Label className="font-semibold">구독 서비스</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="서비스 선택" />
              </SelectTrigger>
              <SelectContent>
                {familyServices.map(s => (
                  <SelectItem key={s.name} value={s.name}>
                    <span className="flex items-center gap-2">
                      <BrandIcon name={s.name} icon={s.icon} size="sm" />
                      {s.name}
                      {s.familyPlan && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (최대 {s.familyPlan.maxMembers}인)
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPreset?.familyPlan && (
            <div className="bg-accent rounded-xl p-4 text-sm space-y-1">
              <p>
                <strong>{selectedPreset.familyPlan.name}</strong> 요금제:{' '}
                {formatKRW(selectedPreset.familyPlan.price)}/월
              </p>
              <p className="text-muted-foreground">
                최대 {selectedPreset.familyPlan.maxMembers}인 공유 가능
              </p>
            </div>
          )}

          {/* Max members */}
          <div className="space-y-2">
            <Label className="font-semibold">모집 인원 (본인 포함)</Label>
            <Select value={maxMembers} onValueChange={setMaxMembers}>
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
                1인당 예상 비용:{' '}
                {formatKRW(Math.round(selectedPreset.familyPlan.price / parseInt(maxMembers, 10)))}
              </p>
            )}
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label className="font-semibold">공개 설정</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  visibility === 'public'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <Globe className="h-4 w-4" />
                공개 모집
              </button>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  visibility === 'private'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <Lock className="h-4 w-4" />
                비공개 (초대 코드)
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {visibility === 'public'
                ? '공개 모집 게시판에 노출됩니다'
                : '초대 코드를 통해서만 참가할 수 있습니다'}
            </p>
          </div>

          {/* Contact type */}
          <div className="space-y-2">
            <Label className="font-semibold">연락 방법</Label>
            <Select
              value={contactType}
              onValueChange={(v) => setContactType(v as 'kakao' | 'discord' | 'other')}
            >
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

          {/* Contact link */}
          <div className="space-y-2">
            <Label className="font-semibold">
              {contactType === 'kakao'
                ? '오픈채팅 링크'
                : contactType === 'discord'
                  ? '디스코드 초대 링크'
                  : '연락처 링크'}
            </Label>
            <Input
              placeholder={
                contactType === 'kakao'
                  ? 'https://open.kakao.com/o/...'
                  : 'https://...'
              }
              value={contactLink}
              onChange={e => setContactLink(e.target.value)}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">수락된 멤버에게만 공개됩니다</p>
          </div>

          {/* Chatroom code */}
          <div className="space-y-2">
            <Label className="font-semibold">채팅방 입장 코드 (선택)</Label>
            <Input
              placeholder="오픈채팅방 비밀번호가 있다면 입력"
              value={chatroomCode}
              onChange={e => setChatroomCode(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label className="font-semibold">모집 코멘트</Label>
            <Textarea
              placeholder="파티 소개, 규칙, 결제일 등을 알려주세요"
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={!service || !contactLink || submitting}
            className="w-full rounded-xl font-semibold"
            size="lg"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            파티 만들기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
