/**
 * T088: Game Repository
 *
 * Data access layer for Game entity.
 * Handles game creation, board state updates, move tracking,
 * and status management for all game types (LOCAL, ONLINE, BOT).
 */

import { prisma } from '@/lib/prisma';
import { Game, GameType, GameStatus, GameResult, Color, Move } from '@prisma/client';
import { logger } from '@/lib/logger';

// Type for Game with optional moves relation
type GameWithMoves = Game & { moves?: Move[] };

/**
 * GameRepository provides data access methods for Game entity.
 * Follows repository pattern to encapsulate Prisma queries.
 */
export class GameRepository {
  /**
   * Creates a new game.
   *
   * @param data - Game creation data
   * @returns Created game
   */
  async create(data: {
    type: GameType;
    whitePlayerId?: string;
    blackPlayerId?: string;
    botDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    boardState?: unknown;
  }): Promise<Game> {
    try {
      const game = await prisma.game.create({
        data: {
          type: data.type,
          status: 'WAITING' as GameStatus,
          whitePlayerId: data.whitePlayerId,
          blackPlayerId: data.blackPlayerId,
          botDifficulty: data.botDifficulty,
          boardState: (data.boardState as object) || {
            pieces: [],
            capturedPieces: { white: 0, black: 0 },
            positionHistory: [],
          },
          currentTurn: 'WHITE' as Color,
        },
      });

      logger.info(`Game created: ${game.id}, type: ${game.type}`);
      return game;
    } catch (error) {
      logger.error('Failed to create game', { error, data });
      throw error;
    }
  }

  /**
   * Finds a game by ID with optional relations.
   */
  async findById(id: string, includeMoves = false): Promise<GameWithMoves | null> {
    try {
      const game = await prisma.game.findUnique({
        where: { id },
        include: includeMoves ? { moves: { orderBy: { sequenceNumber: 'asc' } } } : undefined,
      });

      return game;
    } catch (error) {
      logger.error('Failed to find game by ID', { error, id });
      throw error;
    }
  }

  /**
   * Updates board state.
   */
  async updateBoardState(id: string, boardState: unknown): Promise<Game> {
    try {
      const game = await prisma.game.update({
        where: { id },
        data: { boardState: boardState as object, lastMoveAt: new Date() },
      });

      return game;
    } catch (error) {
      logger.error('Failed to update board state', { error, id });
      throw error;
    }
  }

  /**
   * Updates game status.
   */
  async updateStatus(id: string, status: GameStatus, result?: GameResult): Promise<Game> {
    try {
      const game = await prisma.game.update({
        where: { id },
        data: {
          status,
          result: result || undefined,
        },
      });

      logger.info(`Game ${id} status updated to ${status}${result ? `, result: ${result}` : ''}`);
      return game;
    } catch (error) {
      logger.error('Failed to update game status', { error, id, status });
      throw error;
    }
  }

  /**
   * Saves a move to the database.
   */
  async saveMove(
    gameId: string,
    moveData: {
      sequenceNumber: number;
      color: Color;
      pieceId: string;
      fromRow: number;
      fromCol: number;
      toRow: number;
      toCol: number;
      capturedPieces?: unknown;
      wasPromotion?: boolean;
    }
  ): Promise<void> {
    try {
      await prisma.move.create({
        data: {
          gameId,
          sequenceNumber: moveData.sequenceNumber,
          color: moveData.color,
          pieceId: moveData.pieceId,
          fromRow: moveData.fromRow,
          fromCol: moveData.fromCol,
          toRow: moveData.toRow,
          toCol: moveData.toCol,
          capturedPieces: moveData.capturedPieces || [],
          wasPromotion: moveData.wasPromotion || false,
        },
      });

      logger.debug(`Move ${moveData.sequenceNumber} saved for game ${gameId}`);
    } catch (error) {
      logger.error('Failed to save move', { error, gameId, moveData });
      throw error;
    }
  }

  /**
   * Finds games by player ID.
   */
  async findByPlayerId(playerId: string, status?: GameStatus): Promise<Game[]> {
    try {
      const games = await prisma.game.findMany({
        where: {
          AND: [
            {
              OR: [{ whitePlayerId: playerId }, { blackPlayerId: playerId }],
            },
            status ? { status } : {},
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      return games;
    } catch (error) {
      logger.error('Failed to find games by player', { error, playerId });
      throw error;
    }
  }
}

// Export singleton instance
export const gameRepository = new GameRepository();
