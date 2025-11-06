import {
  validateSimpleMove,
  validateCapture,
  findMultipleCaptures,
  validateKingMove,
} from '@/lib/game/validator';
import { Piece, BoardState, Color, PieceType } from '@/types/game';

describe('Game Validator - Simple Moves', () => {
  const createPiece = (
    id: string,
    color: Color,
    type: PieceType,
    row: number,
    col: number,
  ): Piece => ({
    id,
    color,
    type,
    row,
    col,
  });

  const createEmptyBoard = (): BoardState => ({
    pieces: [],
    capturedPieces: { white: 0, black: 0 },
    positionHistory: [],
  });

  describe('validateSimpleMove', () => {
    it('should allow white piece to move one diagonal forward-right', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const board = createEmptyBoard();
      board.pieces = [piece];

      const result = validateSimpleMove(piece, 4, 1, board);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should allow white piece to move one diagonal forward-left', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 2);
      const board = createEmptyBoard();
      board.pieces = [piece];

      const result = validateSimpleMove(piece, 4, 1, board);

      expect(result.valid).toBe(true);
    });

    it('should allow black piece to move one diagonal forward-right', () => {
      const piece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 2, 1);
      const board = createEmptyBoard();
      board.pieces = [piece];

      const result = validateSimpleMove(piece, 3, 2, board);

      expect(result.valid).toBe(true);
    });

    it('should allow black piece to move one diagonal forward-left', () => {
      const piece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 2, 3);
      const board = createEmptyBoard();
      board.pieces = [piece];

      const result = validateSimpleMove(piece, 3, 2, board);

      expect(result.valid).toBe(true);
    });

    it('should reject move to occupied square', () => {
      const piece1 = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const piece2 = createPiece('w2', Color.WHITE, PieceType.NORMAL, 4, 1);
      const board = createEmptyBoard();
      board.pieces = [piece1, piece2];

      const result = validateSimpleMove(piece1, 4, 1, board);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('ocupada');
    });

    it('should reject backward move for normal piece', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const board = createEmptyBoard();
      board.pieces = [piece];

      const result = validateSimpleMove(piece, 6, 1, board);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('trás');
    });

    it('should reject non-diagonal move', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const board = createEmptyBoard();
      board.pieces = [piece];

      const result = validateSimpleMove(piece, 4, 0, board);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('diagonal');
    });

    it('should reject move more than one square', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const board = createEmptyBoard();
      board.pieces = [piece];

      const result = validateSimpleMove(piece, 3, 2, board);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('uma casa');
    });

    it('should reject move out of bounds', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 0, 0);
      const board = createEmptyBoard();
      board.pieces = [piece];

      const result = validateSimpleMove(piece, -1, 1, board);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('tabuleiro');
    });
  });

  describe('validateCapture', () => {
    it('should allow white piece to capture black piece diagonally', () => {
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 4, 1);
      const board = createEmptyBoard();
      board.pieces = [whitePiece, blackPiece];

      const result = validateCapture(whitePiece, 3, 2, board);

      expect(result.valid).toBe(true);
      expect(result.capturedPiece).toEqual(blackPiece);
    });

    it('should allow black piece to capture white piece diagonally', () => {
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 2, 1);
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 3, 2);
      const board = createEmptyBoard();
      board.pieces = [blackPiece, whitePiece];

      const result = validateCapture(blackPiece, 4, 3, board);

      expect(result.valid).toBe(true);
      expect(result.capturedPiece).toEqual(whitePiece);
    });

    it('should reject capture without enemy piece in between', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const board = createEmptyBoard();
      board.pieces = [piece];

      const result = validateCapture(piece, 3, 2, board);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('adversári');
    });

    it('should reject capture of own piece', () => {
      const piece1 = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const piece2 = createPiece('w2', Color.WHITE, PieceType.NORMAL, 4, 1);
      const board = createEmptyBoard();
      board.pieces = [piece1, piece2];

      const result = validateCapture(piece1, 3, 2, board);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('própria');
    });

    it('should reject capture to occupied square', () => {
      const piece1 = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const piece2 = createPiece('b1', Color.BLACK, PieceType.NORMAL, 4, 1);
      const piece3 = createPiece('w2', Color.WHITE, PieceType.NORMAL, 3, 2);
      const board = createEmptyBoard();
      board.pieces = [piece1, piece2, piece3];

      const result = validateCapture(piece1, 3, 2, board);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('ocupada');
    });
  });

  describe('findMultipleCaptures', () => {
    it('should detect simple multiple capture sequence', () => {
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const blackPiece1 = createPiece('b1', Color.BLACK, PieceType.NORMAL, 4, 1);
      const blackPiece2 = createPiece('b2', Color.BLACK, PieceType.NORMAL, 2, 3);
      const board = createEmptyBoard();
      board.pieces = [whitePiece, blackPiece1, blackPiece2];

      const captures = findMultipleCaptures(whitePiece, board);

      expect(captures.length).toBeGreaterThan(0);
      expect(captures[0].capturedPieces.length).toBe(2); // Two captures in sequence
    });

    it('should return empty array when no multiple captures available', () => {
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 4, 1);
      const board = createEmptyBoard();
      board.pieces = [whitePiece, blackPiece];

      const captures = findMultipleCaptures(whitePiece, board);

      // Should still find the single capture
      expect(captures.length).toBeGreaterThan(0);
      expect(captures[0].capturedPieces.length).toBe(1); // Only one capture
    });

    it('should handle complex multiple capture with branching paths', () => {
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 2);
      const blackPiece1 = createPiece('b1', Color.BLACK, PieceType.NORMAL, 4, 3);
      const blackPiece2 = createPiece('b2', Color.BLACK, PieceType.NORMAL, 2, 5);
      const blackPiece3 = createPiece('b3', Color.BLACK, PieceType.NORMAL, 2, 1);
      const board = createEmptyBoard();
      board.pieces = [whitePiece, blackPiece1, blackPiece2, blackPiece3];

      const captures = findMultipleCaptures(whitePiece, board);

      expect(captures.length).toBeGreaterThan(0);
      // Should find at least one path with multiple captures
      const hasMultipleCapturePath = captures.some(
        (path) => path.capturedPieces.length > 1,
      );
      expect(hasMultipleCapturePath).toBe(true);
    });
  });

  describe('validateKingMove', () => {
    it('should allow king to move multiple squares diagonally forward', () => {
      const king = createPiece('w1', Color.WHITE, PieceType.KING, 5, 0);
      const board = createEmptyBoard();
      board.pieces = [king];

      const result = validateKingMove(king, 2, 3, board);

      expect(result.valid).toBe(true);
    });

    it('should allow king to move multiple squares diagonally backward', () => {
      const king = createPiece('w1', Color.WHITE, PieceType.KING, 2, 3);
      const board = createEmptyBoard();
      board.pieces = [king];

      const result = validateKingMove(king, 5, 0, board);

      expect(result.valid).toBe(true);
    });

    it('should reject king move if path is blocked', () => {
      const king = createPiece('w1', Color.WHITE, PieceType.KING, 5, 0);
      const blocker = createPiece('w2', Color.WHITE, PieceType.NORMAL, 4, 1);
      const board = createEmptyBoard();
      board.pieces = [king, blocker];

      const result = validateKingMove(king, 2, 3, board);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('bloqueado');
    });

    it('should reject non-diagonal king move', () => {
      const king = createPiece('w1', Color.WHITE, PieceType.KING, 5, 0);
      const board = createEmptyBoard();
      board.pieces = [king];

      const result = validateKingMove(king, 5, 3, board);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('diagonal');
    });

    it('should allow king to capture with multiple squares distance', () => {
      const king = createPiece('w1', Color.WHITE, PieceType.KING, 5, 0);
      const enemy = createPiece('b1', Color.BLACK, PieceType.NORMAL, 3, 2);
      const board = createEmptyBoard();
      board.pieces = [king, enemy];

      const result = validateKingMove(king, 2, 3, board);

      expect(result.valid).toBe(true);
      expect(result.capturedPiece).toEqual(enemy);
    });
  });
});
