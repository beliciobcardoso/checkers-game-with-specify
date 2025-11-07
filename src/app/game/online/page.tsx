/**
 * T113: Online Game Menu/Lobby Page
 *
 * Main entry point for online multiplayer.
 * Allows creating rooms, joining rooms, and viewing active games.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { CreateRoomModal } from '@/components/online/CreateRoomModal';
import { JoinRoomModal } from '@/components/online/JoinRoomModal';
import { ActiveGamesList } from '@/components/online/ActiveGamesList';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface ActiveGame {
  id: string;
  type: string;
  status: string;
  currentTurn: string;
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  createdAt: string;
  lastMoveAt: string | null;
}

export default function OnlineMenuPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/game/online');
    }
  }, [status, router]);

  // Fetch active games
  useEffect(() => {
    async function fetchActiveGames() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/games?status=IN_PROGRESS');
        if (response.ok) {
          const data = await response.json();
          setActiveGames(data.games || []);
        }
      } catch {
        // Silently fail - games list will remain empty
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchActiveGames();
    } else if (status === 'unauthenticated' || status === 'loading') {
      setLoading(false);
    }
  }, [session?.user?.id, status]);

  const handleRoomCreated = (roomCode: string) => {
    setShowCreateModal(false);
    router.push(`/game/online/room/${roomCode}`);
  };

  const handleContinueGame = (gameId: string) => {
    router.push(`/game/online/play/${gameId}`);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Jogo Online</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Jogue damas contra outros jogadores em tempo real
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Create Room Card */}
        <Card className="p-6">
          <div className="text-center">
            <div className="text-5xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold mb-2">Criar Sala</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Crie uma nova sala e convide um amigo para jogar
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="w-full">
              Criar Nova Sala
            </Button>
          </div>
        </Card>

        {/* Join Room Card */}
        <Card className="p-6">
          <div className="text-center">
            <div className="text-5xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold mb-2">Entrar em Sala</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tem um código de sala? Entre e comece a jogar
            </p>
            <Button onClick={() => setShowJoinModal(true)} variant="secondary" className="w-full">
              Entrar com Código
            </Button>
          </div>
        </Card>
      </div>

      {/* Active Games Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Partidas em Andamento</h2>
        <ActiveGamesList
          games={activeGames}
          currentPlayerId={session?.user?.id || ''}
          onContinue={handleContinueGame}
          loading={loading}
        />
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRoomCreated={handleRoomCreated}
      />

      <JoinRoomModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </div>
  );
}
