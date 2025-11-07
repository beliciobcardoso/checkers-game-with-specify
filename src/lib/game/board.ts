import { BoardState, Piece, Color, PieceType } from '@/types/game';
import { BOARD_SIZE, INITIAL_PIECES_PER_PLAYER } from '@/lib/constants';

/**
 * Creates the initial checkers board with 24 pieces (12 white, 12 black)
 * Pieces are placed on dark squares in the first 3 rows for each player
 */
export function createInitialBoard(): BoardState {
  const pieces: Piece[] = [];

  // Create black pieces (rows 0, 1, 2)
  let blackPieceId = 1;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Only place pieces on dark squares (where row + col is odd)
      if ((row + col) % 2 === 1) {
        pieces.push({
          id: `b${blackPieceId}`,
          color: Color.BLACK,
          type: PieceType.NORMAL,
          row,
          col,
        });
        blackPieceId++;
      }
    }
  }

  // Create white pieces (rows 5, 6, 7)
  let whitePieceId = 1;
  for (let row = 5; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Only place pieces on dark squares (where row + col is odd)
      if ((row + col) % 2 === 1) {
        pieces.push({
          id: `w${whitePieceId}`,
          color: Color.WHITE,
          type: PieceType.NORMAL,
          row,
          col,
        });
        whitePieceId++;
      }
    }
  }

  // Verify we have the correct number of pieces
  if (pieces.filter((p) => p.color === Color.BLACK).length !== INITIAL_PIECES_PER_PLAYER) {
    throw new Error(`Expected ${INITIAL_PIECES_PER_PLAYER} black pieces`);
  }
  if (pieces.filter((p) => p.color === Color.WHITE).length !== INITIAL_PIECES_PER_PLAYER) {
    throw new Error(`Expected ${INITIAL_PIECES_PER_PLAYER} white pieces`);
  }

  return {
    pieces,
    capturedPieces: {
      white: 0,
      black: 0,
    },
    positionHistory: [],
  };
}

/**
 * Get the piece at a specific position
 */
export function getPieceAt(row: number, col: number, board: BoardState): Piece | null {
  return board.pieces.find((p) => p.row === row && p.col === col) || null;
}

/**
 * Check if a position is within board bounds
 */
export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/**
 * Generate a hash of the current board state for draw detection
 */
export function getBoardHash(board: BoardState): string {
  const sortedPieces = [...board.pieces].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  return sortedPieces.map((p) => `${p.color[0]}${p.type[0]}${p.row}${p.col}`).join('|');
}
