'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useBotGame } from '@/hooks/useBotGame';
import BotGameBoard from '@/components/bot/BotGameBoard';
import { GameOverModal } from '@/components/game/GameOverModal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getDifficultyInfo } from '@/lib/game/bot/factory';
import { GameStatus, Color as ColorEnum } from '@/types/game';

export default function BotGamePlayPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const gameId = params.id as string;

  const {
    game,
    loading,
    error,
    selectedPiece,
    validMoves,
    isBotThinking,
    handleSquareClick,
    botDifficulty,
  } = useBotGame({
    gameId,
    onGameOver: (_finishedGame) => {
      // Game over handled by modal
    },
    onError: (err) => {
      console.error('Bot game error:', err);
    },
  });

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg">Carregando jogo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Autenticação Necessária</h2>
          <p className="mb-4">Você precisa estar autenticado para jogar.</p>
          <Button onClick={() => router.push('/login')}>Fazer Login</Button>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erro</h2>
          <p className="mb-4">{error.message}</p>
          <Button onClick={() => router.push('/game/bot')}>Voltar à Seleção</Button>
        </Card>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Jogo não encontrado</h2>
          <Button onClick={() => router.push('/game/bot')}>Voltar à Seleção</Button>
        </Card>
      </div>
    );
  }

  const difficultyInfo = botDifficulty ? getDifficultyInfo(botDifficulty) : null;
  const isPlayerWhite = game.whitePlayerId === session?.user?.id;
  const playerColor = isPlayerWhite ? 'Brancas' : 'Pretas';
  const isGameOver = game.status === GameStatus.FINISHED;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Partida contra Bot</h1>
          {difficultyInfo && (
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl">{difficultyInfo.icon}</span>
              <span className="text-lg font-medium">{difficultyInfo.label}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Info Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Informações do Jogo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Você:</span>
                  <span className="font-medium">{playerColor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Turno:</span>
                  <span className="font-medium">
                    {game.currentTurn === 'WHITE' ? 'Brancas' : 'Pretas'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Movimentos:</span>
                  <span className="font-medium">{game.moveCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="font-medium">{isGameOver ? 'Finalizado' : 'Em Andamento'}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">Peças Capturadas</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-800"></div>
                    <span className="text-sm">Brancas:</span>
                  </div>
                  <span className="font-medium">{game.boardState.capturedPieces.white}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gray-800 border-2 border-white"></div>
                    <span className="text-sm">Pretas:</span>
                  </div>
                  <span className="font-medium">{game.boardState.capturedPieces.black}</span>
                </div>
              </div>
            </Card>

            {difficultyInfo && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                <h3 className="font-semibold mb-2">Sobre este Bot</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {difficultyInfo.description}
                </p>
              </Card>
            )}

            <div className="space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => router.push('/')}>
                Voltar ao Menu
              </Button>
              {isGameOver && (
                <Button className="w-full" onClick={() => router.push('/game/bot')}>
                  Nova Partida
                </Button>
              )}
            </div>
          </div>

          {/* Game Board */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              <BotGameBoard
                boardState={game.boardState}
                selectedPiece={selectedPiece}
                validMoves={validMoves}
                onSquareClick={handleSquareClick}
                isBotThinking={isBotThinking}
                botDifficulty={botDifficulty}
                disabled={isGameOver}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && game.result && (
        <GameOverModal
          result={game.result}
          winner={
            game.result === 'WHITE_WIN'
              ? ColorEnum.WHITE
              : game.result === 'BLACK_WIN'
                ? ColorEnum.BLACK
                : null
          }
          isDraw={game.result === 'DRAW'}
          onPlayAgain={() => router.push('/game/bot')}
          isOpen={true}
        />
      )}
    </div>
  );
}
