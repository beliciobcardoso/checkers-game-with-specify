/**
 * T114: Waiting Room Page
 *
 * Displays waiting state while waiting for second player.
 * Automatically redirects when game starts.
 */

'use client';

import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { WaitingRoom } from '@/components/online/WaitingRoom';
import { useWebSocket } from '@/hooks/useWebSocket';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

interface RoomData {
  code: string;
  status: string;
  gameId: string;
  hostUsername: string;
}

export default function WaitingRoomPage({ params }: PageProps) {
  const { code } = use(params);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { socket, status: wsStatus } = useWebSocket();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push(`/login?callbackUrl=/game/online/room/${code}`);
    }
  }, [sessionStatus, router, code]);

  // Fetch room details
  useEffect(() => {
    async function fetchRoom() {
      try {
        const response = await fetch(`/api/rooms/${code}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Sala não encontrada');
          } else {
            setError('Erro ao carregar sala');
          }
          return;
        }

        const data = await response.json();
        setRoom(data.room);
      } catch {
        setError('Erro ao carregar sala');
      } finally {
        setLoading(false);
      }
    }

    if (sessionStatus === 'authenticated') {
      fetchRoom();
    }
  }, [code, sessionStatus]);

  // Join room via WebSocket
  useEffect(() => {
    if (!socket || !room || wsStatus !== 'connected' || !session?.user?.id) return;

    socket.emit('JOIN_ROOM', {
      gameId: room.gameId,
      playerId: session.user.id,
    });
  }, [socket, room, wsStatus, session]);

  // Listen for game start
  useEffect(() => {
    if (!socket || !room) return;

    const handleGameStarted = (data: { gameId: string }) => {
      if (data.gameId === room.gameId) {
        router.push(`/game/online/play/${data.gameId}`);
      }
    };

    const handlePlayerJoined = (data: { gameId: string; status: string }) => {
      if (data.gameId === room.gameId && data.status === 'ACTIVE') {
        router.push(`/game/online/play/${data.gameId}`);
      }
    };

    socket.on('game-started', handleGameStarted);
    socket.on('player-joined', handlePlayerJoined);

    return () => {
      socket.off('game-started', handleGameStarted);
      socket.off('player-joined', handlePlayerJoined);
    };
  }, [socket, room, router]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
  };

  const handleCancel = () => {
    router.push('/game/online');
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-gray-500">Carregando sala...</p>
        </div>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Erro</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/game/online')}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            Voltar ao Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <WaitingRoom
          roomCode={code}
          hostUsername={room.hostUsername}
          onCopyCode={handleCopyCode}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
