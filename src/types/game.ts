// Enums
export enum Color {
  WHITE = 'WHITE',
  BLACK = 'BLACK',
}

export enum PieceType {
  NORMAL = 'NORMAL',
  KING = 'KING',
}

export enum GameStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  ABANDONED = 'ABANDONED',
}

export enum GameType {
  LOCAL = 'LOCAL',
  ONLINE = 'ONLINE',
  BOT = 'BOT',
}

export enum GameResult {
  WHITE_WIN = 'WHITE_WIN',
  BLACK_WIN = 'BLACK_WIN',
  DRAW = 'DRAW',
}

// Types
export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  id: string;
  color: Color;
  type: PieceType;
  row: number;
  col: number;
}

export interface BoardState {
  pieces: Piece[];
  capturedPieces: {
    white: number;
    black: number;
  };
  positionHistory: string[];
}

export interface Move {
  from: Position;
  to: Position;
  pieceId: string;
}

export interface Game {
  id: string;
  type: GameType;
  status: GameStatus;
  boardState: BoardState;
  currentTurn: Color;
  moveCount: number;
  result: GameResult | null;
  whitePlayerId?: string | null;
  blackPlayerId?: string | null;
  botDifficulty?: 'EASY' | 'MEDIUM' | 'HARD' | null;
  createdAt: Date;
  updatedAt: Date;
}

// Validation result types
export interface ValidationResult {
  valid: boolean;
  error?: string;
  capturedPiece?: Piece;
}

export interface VictoryCheck {
  isVictory: boolean;
  winner: Color | null;
}

export interface DrawCheck {
  isDraw: boolean;
  reason?: string;
}

// Capture path for multiple captures
export interface CapturePath {
  positions: Position[];
  capturedPieces: Piece[];
}
