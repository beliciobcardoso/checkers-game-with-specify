'use client';

import { BoardState, Position } from '@/types/game';
import { Board } from '@/components/game/Board';
import BotThinking from './BotThinking';
import { BotDifficulty } from '@/lib/game/bot/factory';

interface BotGameBoardProps {
  boardState: BoardState;
  selectedPiece: Position | null;
  validMoves: Position[];
  onSquareClick: (row: number, col: number) => void;
  isBotThinking?: boolean;
  botDifficulty?: BotDifficulty;
  disabled?: boolean;
}

/**
 * Enhanced Board component for bot games
 * Shows loading overlay when bot is calculating moves
 */
export default function BotGameBoard({
  boardState,
  selectedPiece,
  validMoves,
  onSquareClick,
  isBotThinking = false,
  botDifficulty,
  disabled = false,
}: BotGameBoardProps) {
  const handleSquareClick = (row: number, col: number) => {
    // Prevent clicks when bot is thinking or board is disabled
    if (disabled || isBotThinking) {
      return;
    }
    onSquareClick(row, col);
  };

  return (
    <div className="relative">
      {/* Game Board */}
      <div className={isBotThinking || disabled ? 'pointer-events-none opacity-75' : ''}>
        <Board
          boardState={boardState}
          selectedPiece={selectedPiece}
          validMoves={validMoves}
          onSquareClick={handleSquareClick}
        />
      </div>

      {/* Bot Thinking Overlay */}
      {isBotThinking && <BotThinking difficulty={botDifficulty} />}
    </div>
  );
}
