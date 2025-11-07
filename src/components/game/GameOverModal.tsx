import React from 'react';
import { Color, GameResult } from '@/types/game';
import { Button } from '@/components/ui/Button';

interface GameOverModalProps {
  result: GameResult | null;
  winner: Color | null;
  isDraw: boolean;
  drawReason?: string;
  onPlayAgain: () => void;
  isOpen: boolean;
}

/**
 * Modal displayed when the game ends (victory or draw)
 *
 * @param result - Game result (WHITE_WIN, BLACK_WIN, or DRAW)
 * @param winner - Winning color (if not a draw)
 * @param isDraw - Whether the game ended in a draw
 * @param drawReason - Reason for the draw (if applicable)
 * @param onPlayAgain - Handler for "Play Again" button
 * @param isOpen - Whether the modal should be displayed
 */
export function GameOverModal({
  result,
  winner,
  isDraw,
  drawReason,
  onPlayAgain,
  isOpen,
}: GameOverModalProps) {
  if (!isOpen) return null;

  const getTitle = () => {
    if (isDraw) return 'Empate!';
    if (winner === Color.WHITE) return 'Brancas Venceram!';
    if (winner === Color.BLACK) return 'Pretas Venceram!';
    return 'Jogo Finalizado';
  };

  const getMessage = () => {
    if (isDraw && drawReason) return drawReason;
    if (winner === Color.WHITE) return 'As peças brancas ganharam a partida.';
    if (winner === Color.BLACK) return 'As peças pretas ganharam a partida.';
    return '';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        data-testid="game-over-backdrop"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-labelledby="game-over-title"
        aria-modal="true"
        data-testid="game-over-modal"
      >
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
          {/* Title */}
          <h2
            id="game-over-title"
            className="text-3xl font-bold text-center mb-4"
            data-testid="game-over-title"
          >
            {getTitle()}
          </h2>

          {/* Message */}
          <p className="text-lg text-gray-700 text-center mb-8" data-testid="game-over-message">
            {getMessage()}
          </p>

          {/* Result Badge */}
          {result && (
            <div className="text-center mb-6">
              <span
                className="inline-block px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700"
                data-testid="game-over-result"
              >
                {result === GameResult.WHITE_WIN && 'Vitória das Brancas'}
                {result === GameResult.BLACK_WIN && 'Vitória das Pretas'}
                {result === GameResult.DRAW && 'Empate'}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center">
            <Button
              onClick={onPlayAgain}
              variant="primary"
              data-testid="play-again-button"
              aria-label="Play again"
            >
              Jogar Novamente
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
