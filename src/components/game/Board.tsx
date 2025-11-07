import React from 'react';
import { BoardState, Position } from '@/types/game';
import { Square } from './Square';
import { Piece } from './Piece';
import { getPieceAt } from '@/lib/game/board';

interface BoardProps {
  boardState: BoardState;
  selectedPiece: Position | null;
  validMoves: Position[];
  onSquareClick: (row: number, col: number) => void;
}

/**
 * Checkers board component (8x8 grid)
 * Renders squares and pieces, handles click events
 *
 * @param boardState - Current state of the board with all pieces
 * @param selectedPiece - Currently selected piece position (if any)
 * @param validMoves - Array of valid move destinations for the selected piece
 * @param onSquareClick - Handler for square click events
 */
export function Board({ boardState, selectedPiece, validMoves, onSquareClick }: BoardProps) {
  // Helper to check if a position is highlighted
  const isHighlighted = (row: number, col: number): boolean => {
    return validMoves.some((move) => move.row === row && move.col === col);
  };

  // Helper to check if a position is selected
  const isSelected = (row: number, col: number): boolean => {
    return selectedPiece !== null && selectedPiece.row === row && selectedPiece.col === col;
  };

  // Generate 8x8 board
  const rows = [];
  for (let row = 0; row < 8; row++) {
    const cols = [];
    for (let col = 0; col < 8; col++) {
      // Checkers board: dark squares are on (row + col) % 2 === 1
      const isLight = (row + col) % 2 === 0;
      const piece = getPieceAt(row, col, boardState);

      cols.push(
        <Square
          key={`${row}-${col}`}
          row={row}
          col={col}
          isLight={isLight}
          isHighlighted={isHighlighted(row, col)}
          isSelected={isSelected(row, col)}
          onClick={() => onSquareClick(row, col)}
        >
          {piece && <Piece color={piece.color} type={piece.type} id={piece.id} />}
        </Square>
      );
    }
    rows.push(
      <div key={row} className="flex" data-testid={`board-row-${row}`}>
        {cols}
      </div>
    );
  }

  return (
    <div
      className="inline-block border-4 border-gray-800 rounded-lg overflow-hidden shadow-2xl"
      data-testid="checkers-board"
      aria-label="Checkers board"
    >
      {rows}
    </div>
  );
}
