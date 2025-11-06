import {
  Piece,
  BoardState,
  Color,
  PieceType,
  ValidationResult,
  CapturePath,
} from '@/types/game';
import { getPieceAt, isValidPosition } from '@/lib/game/board';

/**
 * Validate a simple move (one diagonal square forward)
 */
export function validateSimpleMove(
  piece: Piece,
  toRow: number,
  toCol: number,
  board: BoardState,
): ValidationResult {
  // Check if destination is within bounds
  if (!isValidPosition(toRow, toCol)) {
    return { valid: false, error: 'Movimento fora do tabuleiro' };
  }

  // Check if destination is occupied
  if (getPieceAt(toRow, toCol, board)) {
    return { valid: false, error: 'Casa de destino está ocupada' };
  }

  const rowDiff = toRow - piece.row;
  const colDiff = Math.abs(toCol - piece.col);

  // Check distance first (must be exactly 1 square)
  if (Math.abs(rowDiff) !== 1 || colDiff !== 1) {
    if (Math.abs(rowDiff) > 1 || colDiff > 1) {
      return { valid: false, error: 'Peça simples move apenas uma casa' };
    }
    return { valid: false, error: 'Movimento deve ser diagonal' };
  }

  // Normal pieces can only move forward
  if (piece.type === PieceType.NORMAL) {
    const forwardDirection = piece.color === Color.WHITE ? -1 : 1;

    if (rowDiff !== forwardDirection) {
      return { valid: false, error: 'Peça simples não pode mover para trás' };
    }
  }

  return { valid: true };
}

/**
 * Validate a capture move (jumping over opponent piece)
 */
export function validateCapture(
  piece: Piece,
  toRow: number,
  toCol: number,
  board: BoardState,
): ValidationResult {
  // Check if destination is within bounds
  if (!isValidPosition(toRow, toCol)) {
    return { valid: false, error: 'Movimento fora do tabuleiro' };
  }

  // Check if destination is occupied
  if (getPieceAt(toRow, toCol, board)) {
    return { valid: false, error: 'Casa de destino está ocupada' };
  }

  const rowDiff = toRow - piece.row;
  const colDiff = toCol - piece.col;

  // Capture must be 2 squares diagonally
  if (Math.abs(rowDiff) !== 2 || Math.abs(colDiff) !== 2) {
    return { valid: false, error: 'Captura deve pular 2 casas diagonalmente' };
  }

  // Check for piece in between
  const middleRow = piece.row + rowDiff / 2;
  const middleCol = piece.col + colDiff / 2;
  const middlePiece = getPieceAt(middleRow, middleCol, board);

  if (!middlePiece) {
    return { valid: false, error: 'Não há peça adversária para capturar' };
  }

  // Can only capture opponent pieces
  if (middlePiece.color === piece.color) {
    return { valid: false, error: 'Não pode capturar própria peça' };
  }

  // For normal pieces, check direction
  if (piece.type === PieceType.NORMAL) {
    // Normal pieces can only capture forward (official rules)
    const forwardDirection = piece.color === Color.WHITE ? -1 : 1;
    const actualDirection = Math.sign(rowDiff);
    
    if (actualDirection !== forwardDirection) {
      return { valid: false, error: 'Peça simples não pode capturar para trás' };
    }
  }

  return { valid: true, capturedPiece: middlePiece };
}

/**
 * Find all possible multiple capture sequences from a position
 */
export function findMultipleCaptures(
  piece: Piece,
  board: BoardState,
  capturedSoFar: Piece[] = [],
): CapturePath[] {
  const paths: CapturePath[] = [];
  const directions = [
    { row: -2, col: -2 },
    { row: -2, col: 2 },
    { row: 2, col: -2 },
    { row: 2, col: 2 },
  ];

  for (const dir of directions) {
    const toRow = piece.row + dir.row;
    const toCol = piece.col + dir.col;

    const result = validateCapture(piece, toRow, toCol, board);

    if (result.valid && result.capturedPiece) {
      // Check if we've already captured this piece in this path
      if (capturedSoFar.some((p) => p.id === result.capturedPiece?.id)) {
        continue;
      }

      // Create a temporary board state with the capture
      const newBoard: BoardState = {
        ...board,
        pieces: board.pieces.filter(
          (p) => p.id !== result.capturedPiece?.id && p.id !== piece.id,
        ),
      };

      const newPiece: Piece = {
        ...piece,
        row: toRow,
        col: toCol,
      };
      newBoard.pieces.push(newPiece);

      const newCaptured = [...capturedSoFar, result.capturedPiece];

      // Recursively find more captures
      const furtherCaptures = findMultipleCaptures(
        newPiece,
        newBoard,
        newCaptured,
      );

      if (furtherCaptures.length > 0) {
        // Add all the further capture paths
        paths.push(...furtherCaptures);
      } else {
        // No more captures possible, add this path
        paths.push({
          positions: [{ row: toRow, col: toCol }],
          capturedPieces: newCaptured,
        });
      }
    }
  }

  // If we have captured pieces but found no new captures, return current path
  if (paths.length === 0 && capturedSoFar.length > 0) {
    return [
      {
        positions: [{ row: piece.row, col: piece.col }],
        capturedPieces: capturedSoFar,
      },
    ];
  }

  return paths;
}

/**
 * Validate a king (dama) move - can move multiple squares diagonally
 */
export function validateKingMove(
  piece: Piece,
  toRow: number,
  toCol: number,
  board: BoardState,
): ValidationResult {
  if (piece.type !== PieceType.KING) {
    return { valid: false, error: 'Apenas damas podem fazer este movimento' };
  }

  // Check if destination is within bounds
  if (!isValidPosition(toRow, toCol)) {
    return { valid: false, error: 'Movimento fora do tabuleiro' };
  }

  // Check if destination is occupied
  const destPiece = getPieceAt(toRow, toCol, board);
  if (destPiece) {
    return { valid: false, error: 'Casa de destino está ocupada' };
  }

  const rowDiff = toRow - piece.row;
  const colDiff = toCol - piece.col;

  // Must move diagonally (abs values must be equal)
  if (Math.abs(rowDiff) !== Math.abs(colDiff)) {
    return { valid: false, error: 'Dama deve mover diagonalmente' };
  }

  // Check if path is clear and find any pieces to capture
  const rowStep = rowDiff > 0 ? 1 : -1;
  const colStep = colDiff > 0 ? 1 : -1;

  let capturedPiece: Piece | undefined;
  let currentRow = piece.row + rowStep;
  let currentCol = piece.col + colStep;

  while (currentRow !== toRow || currentCol !== toCol) {
    const pieceInPath = getPieceAt(currentRow, currentCol, board);

    if (pieceInPath) {
      // If we already found a piece, path is blocked
      if (capturedPiece) {
        return { valid: false, error: 'Caminho bloqueado por múltiplas peças' };
      }

      // Can't capture own piece
      if (pieceInPath.color === piece.color) {
        return { valid: false, error: 'Caminho bloqueado por peça própria' };
      }

      capturedPiece = pieceInPath;
    }

    currentRow += rowStep;
    currentCol += colStep;
  }

  return { valid: true, capturedPiece };
}
