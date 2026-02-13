'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  PublicPartyBoard,
  MyPartyList,
  CreatePartyDialog,
  JoinByCodeForm,
  PartyRoom,
} from '@/components/party';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Megaphone, LogIn, Loader2 } from 'lucide-react';
import type { MyParty } from '@/components/party/MyPartyList';

function PartyPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedParty, setSelectedParty] = useState<MyParty | null>(null);
  const [activeTab, setActiveTab] = useState('my-parties');
  const [inviteCode, setInviteCode] = useState('');

  // Handle ?code=ABC123 from QR scan
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code.toUpperCase());
      setActiveTab('join');
    }
  }, [searchParams]);

  // If viewing a party room
  if (selectedParty) {
    return (
      <main className="container max-w-6xl mx-auto p-6 space-y-8">
        <PartyRoom
          party={selectedParty}
          onBack={() => setSelectedParty(null)}
        />
      </main>
    );
  }

  return (
    <main className="container max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <Users className="h-9 w-9" aria-hidden="true" />
            공유 파티
          </h1>
          <p className="text-muted-foreground text-lg">
            구독을 함께 나누고 비용을 절약하세요
          </p>
        </div>
        {user && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="lg"
            className="rounded-xl font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" />
            파티 만들기
          </Button>
        )}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 rounded-xl p-1.5 bg-accent">
          <TabsTrigger value="my-parties" className="rounded-lg font-semibold">
            내 파티
          </TabsTrigger>
          <TabsTrigger value="public" className="rounded-lg font-semibold">
            <Megaphone className="mr-1.5 h-3.5 w-3.5" />
            공개 모집
          </TabsTrigger>
          <TabsTrigger value="join" className="rounded-lg font-semibold">
            <LogIn className="mr-1.5 h-3.5 w-3.5" />
            파티 참가하기
          </TabsTrigger>
        </TabsList>

        {/* My Parties Tab */}
        <TabsContent value="my-parties" className="space-y-6">
          <MyPartyList
            onCreateClick={() => setShowCreateDialog(true)}
            onPartyClick={(party) => setSelectedParty(party)}
          />
        </TabsContent>

        {/* Public Board Tab */}
        <TabsContent value="public" className="space-y-6">
          <PublicPartyBoard />
        </TabsContent>

        {/* Join Party Tab */}
        <TabsContent value="join" className="space-y-6">
          <JoinByCodeForm initialCode={inviteCode} />
        </TabsContent>
      </Tabs>

      {/* Create Party Dialog */}
      <CreatePartyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={() => setActiveTab('my-parties')}
      />
    </main>
  );
}

export default function PartyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <PartyPageContent />
    </Suspense>
  );
}
