/**
 * T115: Online Game Play Page
 *
 * Active game page with OnlineGameBoard.
 * Handles real-time multiplayer gameplay.
 */

'use client';

import { useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { OnlineGameBoard } from '@/components/online/OnlineGameBoard';
import { Button } from '@/components/ui';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    gameId: string;
  }>;
}

export default function OnlineGamePlayPage({ params }: PageProps) {
  const { gameId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/game/online/play/${gameId}`);
    }
  }, [status, router, gameId]);

  const handleResign = () => {
    router.push('/game/online');
  };

  const handleBackToLobby = () => {
    router.push('/game/online');
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Partida Online</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {gameId}</p>
        </div>
        <Button onClick={handleBackToLobby} variant="secondary">
          Voltar ao Lobby
        </Button>
      </div>

      {/* Game Board */}
      <OnlineGameBoard gameId={gameId} playerId={session?.user?.id || ''} onResign={handleResign} />

      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded">
        <h3 className="font-semibold mb-2">Como jogar:</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Clique em uma peça para selecioná-la</li>
          <li>• Clique em um quadrado destacado para mover</li>
          <li>• Capturas são obrigatórias quando disponíveis</li>
          <li>• Capturas múltiplas são executadas em sequência</li>
          <li>• Uma peça vira dama ao alcançar a última fileira</li>
        </ul>
      </div>
    </div>
  );
}
