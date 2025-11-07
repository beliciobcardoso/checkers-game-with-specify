'use client';

import { Board } from '@/components/game/Board';
import { GameControls } from '@/components/game/GameControls';
import { GameOverModal } from '@/components/game/GameOverModal';
import { useLocalGame } from '@/hooks/useLocalGame';
import { GameStatus, GameResult } from '@/types/game';

/**
 * Local game page - two players on the same device
 *
 * Provides a complete checkers game experience with:
 * - 8x8 board with pieces
 * - Move validation and highlighting
 * - Capture detection (simple and multiple)
 * - Piece promotion to king
 * - Victory and draw detection
 * - Game controls (restart, resign)
 */
export default function LocalGamePage() {
  const { game, selectedPiece, validMoves, winner, handleSquareClick, resetGame } = useLocalGame();

  const isGameOver = game.status === GameStatus.FINISHED;

  const handleResign = () => {
    // In local game, resigning means the current player loses
    // We'll just reset for simplicity
    resetGame();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Jogo de Damas - Local</h1>
          <p className="text-gray-600">Dois jogadores no mesmo dispositivo</p>
        </header>

        {/* Game Container */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Board */}
          <div className="flex-shrink-0">
            <Board
              boardState={game.boardState}
              selectedPiece={selectedPiece}
              validMoves={validMoves}
              onSquareClick={handleSquareClick}
            />
          </div>

          {/* Controls */}
          <div className="flex-shrink-0">
            <GameControls
              currentTurn={game.currentTurn}
              onRestart={resetGame}
              onResign={handleResign}
              isGameOver={isGameOver}
            />
          </div>
        </div>

        {/* Game Over Modal */}
        <GameOverModal
          result={game.result}
          winner={winner}
          isDraw={game.result === GameResult.DRAW}
          onPlayAgain={resetGame}
          isOpen={isGameOver}
        />
      </div>
    </div>
  );
}
