/**
 * T110: ActiveGamesList Component
 *
 * Lists player's active online games.
 * Allows resuming games in progress.
 */

'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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

interface ActiveGamesListProps {
  games: ActiveGame[];
  currentPlayerId: string;
  onContinue: (gameId: string) => void;
  loading?: boolean;
}

export function ActiveGamesList({
  games,
  currentPlayerId,
  onContinue,
  loading,
}: ActiveGamesListProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">Carregando partidas...</div>
      </Card>
    );
  }

  if (games.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p className="text-4xl mb-2">🎮</p>
          <p>Nenhuma partida ativa</p>
          <p className="text-sm mt-1">Crie uma sala ou entre em uma existente para começar</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {games.map((game) => {
        const isMyTurn =
          game.currentTurn === (game.whitePlayerId === currentPlayerId ? 'WHITE' : 'BLACK');
        const myColor = game.whitePlayerId === currentPlayerId ? 'Brancas' : 'Pretas';
        const lastMove = game.lastMoveAt
          ? new Date(game.lastMoveAt).toLocaleString('pt-BR')
          : 'Início';

        return (
          <Card key={game.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${isMyTurn ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}
                  ></div>
                  <h3 className="font-semibold">
                    {isMyTurn ? '🔔 Sua vez!' : 'Aguardando oponente'}
                  </h3>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>
                    <span className="font-medium">Você:</span> {myColor}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span> {game.status}
                  </p>
                  <p>
                    <span className="font-medium">Último movimento:</span> {lastMove}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => onContinue(game.id)}
                variant={isMyTurn ? 'primary' : 'secondary'}
                size="sm"
              >
                Continuar
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
