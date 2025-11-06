import {
  executeMove,
  checkPromotion,
  checkVictory,
  checkDraw,
  getValidMoves,
} from '@/lib/game/engine';
import { Piece, BoardState, Color, PieceType, Game, GameStatus, Move } from '@/types/game';

describe('Game Engine', () => {
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

  const createGame = (board: BoardState, currentTurn: Color): Game => ({
    id: 'test-game',
    type: 'LOCAL',
    status: GameStatus.IN_PROGRESS,
    boardState: board,
    currentTurn,
    moveCount: 0,
    result: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('checkPromotion', () => {
    it('should promote white piece reaching row 0', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 0, 1);

      const shouldPromote = checkPromotion(piece);

      expect(shouldPromote).toBe(true);
    });

    it('should promote black piece reaching row 7', () => {
      const piece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 7, 2);

      const shouldPromote = checkPromotion(piece);

      expect(shouldPromote).toBe(true);
    });

    it('should not promote white piece not at row 0', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 1, 1);

      const shouldPromote = checkPromotion(piece);

      expect(shouldPromote).toBe(false);
    });

    it('should not promote black piece not at row 7', () => {
      const piece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 6, 2);

      const shouldPromote = checkPromotion(piece);

      expect(shouldPromote).toBe(false);
    });

    it('should not promote piece that is already a king', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.KING, 0, 1);

      const shouldPromote = checkPromotion(piece);

      expect(shouldPromote).toBe(false);
    });
  });

  describe('executeMove', () => {
    it('should update piece position after simple move', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const board = createEmptyBoard();
      board.pieces = [piece];
      const game = createGame(board, Color.WHITE);

      const move: Move = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        pieceId: 'w1',
      };

      const updatedGame = executeMove(move, game);

      const movedPiece = updatedGame.boardState.pieces.find((p) => p.id === 'w1');
      expect(movedPiece?.row).toBe(4);
      expect(movedPiece?.col).toBe(1);
    });

    it('should remove captured piece and update count', () => {
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 4, 1);
      const board = createEmptyBoard();
      board.pieces = [whitePiece, blackPiece];
      const game = createGame(board, Color.WHITE);

      const move: Move = {
        from: { row: 5, col: 0 },
        to: { row: 3, col: 2 },
        pieceId: 'w1',
      };

      const updatedGame = executeMove(move, game);

      expect(updatedGame.boardState.pieces.length).toBe(1);
      expect(updatedGame.boardState.capturedPieces.black).toBe(1);
      expect(updatedGame.boardState.pieces.find((p) => p.id === 'b1')).toBeUndefined();
    });

    it('should promote piece after reaching promotion row', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 1, 0);
      const board = createEmptyBoard();
      board.pieces = [piece];
      const game = createGame(board, Color.WHITE);

      const move: Move = {
        from: { row: 1, col: 0 },
        to: { row: 0, col: 1 },
        pieceId: 'w1',
      };

      const updatedGame = executeMove(move, game);

      const movedPiece = updatedGame.boardState.pieces.find((p) => p.id === 'w1');
      expect(movedPiece?.type).toBe(PieceType.KING);
    });

    it('should switch current turn after move', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const board = createEmptyBoard();
      board.pieces = [piece];
      const game = createGame(board, Color.WHITE);

      const move: Move = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        pieceId: 'w1',
      };

      const updatedGame = executeMove(move, game);

      expect(updatedGame.currentTurn).toBe(Color.BLACK);
    });

    it('should increment move count', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const board = createEmptyBoard();
      board.pieces = [piece];
      const game = createGame(board, Color.WHITE);

      const move: Move = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        pieceId: 'w1',
      };

      const updatedGame = executeMove(move, game);

      expect(updatedGame.moveCount).toBe(1);
    });

    it('should add position to history', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const board = createEmptyBoard();
      board.pieces = [piece];
      const game = createGame(board, Color.WHITE);

      const move: Move = {
        from: { row: 5, col: 0 },
        to: { row: 4, col: 1 },
        pieceId: 'w1',
      };

      const updatedGame = executeMove(move, game);

      expect(updatedGame.boardState.positionHistory.length).toBeGreaterThan(0);
    });
  });

  describe('checkVictory', () => {
    it('should detect victory when opponent has no pieces', () => {
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const board = createEmptyBoard();
      board.pieces = [whitePiece];
      const game = createGame(board, Color.BLACK);

      const result = checkVictory(game);

      expect(result.isVictory).toBe(true);
      expect(result.winner).toBe(Color.WHITE);
    });

    it('should detect victory when opponent has no valid moves', () => {
      // Create a scenario where black has pieces but they're all blocked
      const whitePiece1 = createPiece('w1', Color.WHITE, PieceType.NORMAL, 6, 1);
      const whitePiece2 = createPiece('w2', Color.WHITE, PieceType.NORMAL, 6, 3);
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 7, 2);
      const board = createEmptyBoard();
      board.pieces = [whitePiece1, whitePiece2, blackPiece];
      const game = createGame(board, Color.BLACK);

      const result = checkVictory(game);

      expect(result.isVictory).toBe(true);
      expect(result.winner).toBe(Color.WHITE);
    });

    it('should not detect victory when both players have pieces and moves', () => {
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 2, 3);
      const board = createEmptyBoard();
      board.pieces = [whitePiece, blackPiece];
      const game = createGame(board, Color.WHITE);

      const result = checkVictory(game);

      expect(result.isVictory).toBe(false);
      expect(result.winner).toBeNull();
    });
  });

  describe('checkDraw', () => {
    it('should detect draw after 40 moves without capture', () => {
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.KING, 0, 1);
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.KING, 7, 6);
      const board = createEmptyBoard();
      board.pieces = [whitePiece, blackPiece];
      const game = createGame(board, Color.WHITE);
      game.moveCount = 40;

      const result = checkDraw(game);

      expect(result.isDraw).toBe(true);
      expect(result.reason).toContain('40 movimentos');
    });

    it('should detect draw when position repeats 3 times', () => {
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.KING, 0, 1);
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.KING, 7, 6);
      const board = createEmptyBoard();
      board.pieces = [whitePiece, blackPiece];
      board.positionHistory = ['pos1', 'pos2', 'pos1', 'pos2', 'pos1'];
      const game = createGame(board, Color.WHITE);

      const result = checkDraw(game);

      expect(result.isDraw).toBe(true);
      expect(result.reason).toContain('repetição');
    });

    it('should not detect draw in normal game', () => {
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 2, 3);
      const board = createEmptyBoard();
      board.pieces = [whitePiece, blackPiece];
      const game = createGame(board, Color.WHITE);
      game.moveCount = 10;

      const result = checkDraw(game);

      expect(result.isDraw).toBe(false);
    });
  });

  describe('getValidMoves', () => {
    it('should return all valid simple moves for a piece', () => {
      const piece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 2);
      const board = createEmptyBoard();
      board.pieces = [piece];

      const validMoves = getValidMoves(piece, board);

      expect(validMoves.length).toBeGreaterThan(0);
      expect(validMoves).toContainEqual({ row: 4, col: 1 });
      expect(validMoves).toContainEqual({ row: 4, col: 3 });
    });

    it('should prioritize captures over simple moves', () => {
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 4, 1);
      const board = createEmptyBoard();
      board.pieces = [whitePiece, blackPiece];

      const validMoves = getValidMoves(whitePiece, board);

      // When capture is available, only capture moves should be returned
      expect(validMoves.length).toBe(1);
      expect(validMoves).toContainEqual({ row: 3, col: 2 });
    });

    it('should return all positions in multiple capture sequence', () => {
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 0);
      const blackPiece1 = createPiece('b1', Color.BLACK, PieceType.NORMAL, 4, 1);
      const blackPiece2 = createPiece('b2', Color.BLACK, PieceType.NORMAL, 2, 3);
      const board = createEmptyBoard();
      board.pieces = [whitePiece, blackPiece1, blackPiece2];

      const validMoves = getValidMoves(whitePiece, board);

      // Should show the first capture position
      // Multiple captures will be handled during move execution
      expect(validMoves.length).toBeGreaterThan(0);
      expect(validMoves).toContainEqual({ row: 3, col: 2 });
    });

    it('should return empty array for piece with no valid moves', () => {
      // Black piece at top row, can't move forward and blocked
      const whitePiece1 = createPiece('w1', Color.WHITE, PieceType.NORMAL, 6, 1);
      const whitePiece2 = createPiece('w2', Color.WHITE, PieceType.NORMAL, 6, 3);
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 7, 2);
      const board = createEmptyBoard();
      board.pieces = [whitePiece1, whitePiece2, blackPiece];

      const validMoves = getValidMoves(blackPiece, board);

      expect(validMoves.length).toBe(0);
    });

    it('should return long diagonal moves for king', () => {
      const king = createPiece('w1', Color.WHITE, PieceType.KING, 4, 3);
      const board = createEmptyBoard();
      board.pieces = [king];

      const validMoves = getValidMoves(king, board);

      // King should have moves in all 4 diagonal directions
      expect(validMoves.length).toBeGreaterThan(4);
      // Should include long-distance moves
      expect(validMoves).toContainEqual({ row: 0, col: 7 });
      expect(validMoves).toContainEqual({ row: 7, col: 0 });
    });
  });
});
