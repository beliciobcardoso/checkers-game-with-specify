import React from 'react';
import { Color } from '@/types/game';
import { Button } from '@/components/ui/Button';

interface GameControlsProps {
  currentTurn: Color;
  onRestart: () => void;
  onResign: () => void;
  isGameOver: boolean;
}

/**
 * Game controls component - displays current turn and game actions
 * 
 * @param currentTurn - Which color's turn it is (WHITE or BLACK)
 * @param onRestart - Handler for restart button click
 * @param onResign - Handler for resign button click
 * @param isGameOver - Whether the game has ended
 */
export function GameControls({
  currentTurn,
  onRestart,
  onResign,
  isGameOver,
}: GameControlsProps) {
  const turnText = currentTurn === Color.WHITE ? 'Brancas' : 'Pretas';
  
  return (
    <div
      className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-lg"
      data-testid="game-controls"
    >
      {/* Current Turn Display */}
      <div className="text-center">
        <p className="text-sm text-gray-600 uppercase tracking-wide">Turno</p>
        <p
          className="text-2xl font-bold"
          data-testid="current-turn"
        >
          {turnText}
        </p>
      </div>

      {/* Separator */}
      <div className="border-t border-gray-200" />

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={onRestart}
          variant="primary"
          data-testid="restart-button"
          aria-label="Restart game"
        >
          Reiniciar Jogo
        </Button>

        {!isGameOver && (
          <Button
            onClick={onResign}
            variant="secondary"
            data-testid="resign-button"
            aria-label="Resign game"
          >
            Desistir
          </Button>
        )}
      </div>
    </div>
  );
}
