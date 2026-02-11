'use client';

import { useState } from 'react';
import { usePartyStore } from '@/stores/partyStore';
import {
  PartyCreateForm,
  PartyCard,
  InviteLinkShare,
  PartyMemberList,
} from '@/components/party';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, LogIn, PartyPopper } from 'lucide-react';

export default function PartyPage() {
  const parties = usePartyStore((state) => state.parties);
  const joinParty = usePartyStore((state) => state.joinParty);
  const leaveParty = usePartyStore((state) => state.leaveParty);
  const closeParty = usePartyStore((state) => state.closeParty);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);

  const [joinCode, setJoinCode] = useState('');
  const [joinNickname, setJoinNickname] = useState('');

  const [currentUserNickname] = useState('나'); // In a real app, this would come from auth

  const activeParties = parties.filter((p) => p.status !== 'closed');

  const handleCreateSuccess = (partyId: string) => {
    setShowCreateDialog(false);
    const party = parties.find((p) => p.id === partyId);
    if (party) {
      setSelectedParty(partyId);
      setShowShareDialog(true);
    }
  };

  const handleJoinParty = () => {
    if (!joinCode.trim() || !joinNickname.trim()) {
      alert('초대 코드와 닉네임을 모두 입력해주세요.');
      return;
    }

    const success = joinParty(joinCode.trim(), joinNickname.trim());
    if (success) {
      setJoinCode('');
      setJoinNickname('');
    } else {
      alert('초대 코드가 올바르지 않거나 파티가 이미 가득 찼어요.');
    }
  };

  const handleShare = (party: any) => {
    setSelectedParty(party.id);
    setShowShareDialog(true);
  };

  const handleShowMembers = (partyId: string) => {
    setSelectedParty(partyId);
    setShowMembersDialog(true);
  };

  const handleLeave = (partyId: string, memberId: string) => {
    leaveParty(partyId, memberId);
  };

  const handleClose = (partyId: string) => {
    closeParty(partyId);
  };

  const currentParty = selectedParty
    ? parties.find((p) => p.id === selectedParty)
    : null;

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <Users className="h-9 w-9" />
            공유 파티
          </h1>
          <p className="text-muted-foreground text-lg">
            구독을 함께 나누고 비용을 절약하세요
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          size="lg"
          className="rounded-xl font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          파티 만들기
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="my-parties" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 rounded-xl p-1.5 bg-accent">
          <TabsTrigger value="my-parties" className="rounded-lg font-semibold">
            내 파티 ({activeParties.length})
          </TabsTrigger>
          <TabsTrigger value="join" className="rounded-lg font-semibold">
            파티 참가하기
          </TabsTrigger>
        </TabsList>

        {/* My Parties Tab */}
        <TabsContent value="my-parties" className="space-y-6">
          {activeParties.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-20 text-center">
                <PartyPopper className="h-20 w-20 mx-auto text-muted-foreground/30 mb-6" />
                <h3 className="text-2xl font-bold mb-3">
                  아직 참여한 파티가 없어요
                </h3>
                <p className="text-muted-foreground mb-8 text-lg">
                  새로운 파티를 만들거나 친구의 파티에 참가해보세요
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    onClick={() => setShowCreateDialog(true)}
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
                    파티 참가하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {activeParties.map((party) => (
                <div key={party.id}>
                  <PartyCard
                    party={party}
                    currentUserNickname={currentUserNickname}
                    onShare={handleShare}
                    onLeave={handleLeave}
                    onClose={handleClose}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleShowMembers(party.id)}
                  >
                    파티원 보기
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Join Party Tab */}
        <TabsContent value="join" className="space-y-6">
          <Card className="rounded-2xl">
            <CardContent className="p-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-2">
                  초대 코드로 참가하기
                </h3>
                <p className="text-base text-muted-foreground">
                  친구에게 받은 초대 코드를 입력하세요
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="invite-code" className="font-semibold">
                    초대 코드
                  </Label>
                  <Input
                    id="invite-code"
                    placeholder="예: ABC123"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="font-mono text-lg tracking-wider rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="join-nickname" className="font-semibold">
                    내 닉네임
                  </Label>
                  <Input
                    id="join-nickname"
                    placeholder="파티에서 사용할 닉네임"
                    value={joinNickname}
                    onChange={(e) => setJoinNickname(e.target.value)}
                    maxLength={20}
                    className="rounded-xl"
                  />
                </div>

                <Button
                  onClick={handleJoinParty}
                  disabled={!joinCode.trim() || !joinNickname.trim()}
                  className="w-full rounded-xl font-semibold"
                  size="lg"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  파티 참가하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Party Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              새 공유 파티 만들기
            </DialogTitle>
          </DialogHeader>
          <PartyCreateForm onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              파티 초대하기
            </DialogTitle>
          </DialogHeader>
          {currentParty && <InviteLinkShare party={currentParty} />}
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">파티원 목록</DialogTitle>
          </DialogHeader>
          {currentParty && (
            <PartyMemberList
              party={currentParty}
              currentUserNickname={currentUserNickname}
              onRemoveMember={handleLeave}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
