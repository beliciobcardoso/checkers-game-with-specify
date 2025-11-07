import React from 'react';
import { Color, PieceType } from '@/types/game';
import { cn } from '@/lib/utils';

interface PieceProps {
  color: Color;
  type: PieceType;
  id: string;
}

/**
 * Represents a checkers piece (normal or king)
 *
 * @param color - Piece color (WHITE or BLACK)
 * @param type - Piece type (NORMAL or KING)
 * @param id - Unique piece identifier
 */
export function Piece({ color, type, id }: PieceProps) {
  const isWhite = color === Color.WHITE;
  const isKing = type === PieceType.KING;

  const baseClasses =
    'w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-200 shadow-lg';

  const colorClasses = isWhite ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-900';

  return (
    <div
      className={cn(baseClasses, colorClasses)}
      data-testid={`piece-${id}`}
      aria-label={`${isWhite ? 'White' : 'Black'} ${isKing ? 'king' : 'piece'}`}
    >
      {isKing && (
        <svg
          className={cn('w-8 h-8', isWhite ? 'text-gray-700' : 'text-white')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
      )}
    </div>
  );
}
