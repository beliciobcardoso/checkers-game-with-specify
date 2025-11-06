import React from 'react';
import { cn } from '@/lib/utils';

interface SquareProps {
  row: number;
  col: number;
  isLight: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

/**
 * Represents a single square on the checkers board
 * 
 * @param row - Row position (0-7)
 * @param col - Column position (0-7)
 * @param isLight - Whether this is a light square (light squares are not playable in checkers)
 * @param isHighlighted - Whether to highlight this square as a valid move destination
 * @param isSelected - Whether this square contains the currently selected piece
 * @param onClick - Handler for square click events
 * @param children - Child elements (typically a Piece component)
 */
export function Square({
  row,
  col,
  isLight,
  isHighlighted = false,
  isSelected = false,
  onClick,
  children,
}: SquareProps) {
  const baseClasses = 'relative w-full h-full flex items-center justify-center';
  
  const colorClasses = isLight
    ? 'bg-board-light'
    : 'bg-board-dark';
  
  const stateClasses = cn({
    'ring-4 ring-blue-400 ring-inset': isSelected,
    'ring-4 ring-green-400 ring-inset': isHighlighted && !isSelected,
    'cursor-pointer hover:opacity-80': onClick && !isLight,
    'cursor-not-allowed': isLight,
  });
  
  return (
    <div
      className={cn(baseClasses, colorClasses, stateClasses)}
      onClick={!isLight ? onClick : undefined}
      data-testid={`square-${row}-${col}`}
      tabIndex={!isLight && onClick ? 0 : -1}
      aria-label={`Square ${row},${col}${isLight ? ' (not playable)' : ''}${isSelected ? ' (selected)' : ''}${isHighlighted ? ' (valid move)' : ''}`}
    >
      {children}
    </div>
  );
}
