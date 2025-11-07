import { BoardState } from '@/types/game';
import { Prisma } from '@prisma/client';

/**
 * Serializa o estado do tabuleiro para armazenamento no Prisma
 * @param boardState Estado do tabuleiro
 * @returns Objeto JSON serializável
 */
export function serializeBoardState(boardState: BoardState): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(boardState));
}

/**
 * Desserializa o estado do tabuleiro do Prisma
 * @param json Objeto JSON do Prisma
 * @returns Estado do tabuleiro
 */
export function deserializeBoardState(json: Prisma.JsonValue): BoardState {
  const data = json as Record<string, unknown>;
  return {
    pieces: (data.pieces as BoardState['pieces']) || {},
    capturedPieces: (data.capturedPieces as BoardState['capturedPieces']) || {
      white: 0,
      black: 0,
    },
    positionHistory: (data.positionHistory as string[]) || [],
  };
}
