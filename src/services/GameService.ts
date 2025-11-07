/**
 * T090: Game Service
 *
 * Business logic layer for online game management.
 * Handles game creation, move validation, status updates,
 * and integrates with game engine for rule enforcement.
 */

import { gameRepository } from '@/lib/db/repositories/game';
import { createInitialBoard, getPieceAt } from '@/lib/game/board';
import { executeMove, checkVictory, checkDraw } from '@/lib/game/engine';
import { logger } from '@/lib/logger';
import { GameType, GameStatus, GameResult } from '@prisma/client';
import {
  Color,
  GameType as EngineGameType,
  GameStatus as EngineGameStatus,
  GameResult as EngineGameResult,
} from '@/types/game';
import type { BoardState, Game } from '@/types/game';
import { playerService } from './PlayerService';

export class GameService {
  /**
   * Creates a new online game.
   *
   * @param whitePlayerId - ID of white player
   * @param blackPlayerId - Optional ID of black player
   * @returns Created game
   */
  async createGame(whitePlayerId: string, blackPlayerId?: string) {
    try {
      // Initialize board with standard checkers setup
      const boardState = createInitialBoard();

      const game = await gameRepository.create({
        type: 'ONLINE' as GameType,
        whitePlayerId,
        blackPlayerId,
        boardState: {
          pieces: boardState.pieces,
          capturedPieces: boardState.capturedPieces,
          positionHistory: [],
        },
      });

      logger.info(`Online game created: ${game.id}`);

      return {
        id: game.id,
        type: game.type,
        status: game.status,
        whitePlayerId: game.whitePlayerId,
        blackPlayerId: game.blackPlayerId,
        currentTurn: game.currentTurn,
        boardState: game.boardState,
      };
    } catch (error) {
      logger.error('Failed to create game', { error, whitePlayerId, blackPlayerId });
      throw new Error('Não foi possível criar a partida');
    }
  }

  /**
   * Gets game by ID.
   *
   * @param gameId - Game UUID
   * @param includeMoves - Whether to include move history
   * @returns Game details
   */
  async getGame(gameId: string, includeMoves = false) {
    try {
      const game = await gameRepository.findById(gameId, includeMoves);

      if (!game) {
        throw new Error('Partida não encontrada');
      }

      return {
        id: game.id,
        type: game.type,
        status: game.status,
        result: game.result,
        whitePlayerId: game.whitePlayerId,
        blackPlayerId: game.blackPlayerId,
        currentTurn: game.currentTurn,
        boardState: game.boardState,
        moves: game.moves || [],
        createdAt: game.createdAt,
        lastMoveAt: game.lastMoveAt,
      };
    } catch (error) {
      logger.error('Failed to get game', { error, gameId });

      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Não foi possível obter informações da partida');
    }
  }

  /**
   * Lists games for a player.
   *
   * @param playerId - Player UUID
   * @param status - Optional status filter
   * @returns Array of games
   */
  async listPlayerGames(playerId: string, status?: GameStatus) {
    try {
      const games = await gameRepository.findByPlayerId(playerId, status);

      return games.map((game) => ({
        id: game.id,
        type: game.type,
        status: game.status,
        result: game.result,
        whitePlayerId: game.whitePlayerId,
        blackPlayerId: game.blackPlayerId,
        currentTurn: game.currentTurn,
        createdAt: game.createdAt,
        lastMoveAt: game.lastMoveAt,
      }));
    } catch (error) {
      logger.error('Failed to list player games', { error, playerId });
      throw new Error('Não foi possível listar partidas do jogador');
    }
  }

  /**
   * Executes a move in an online game.
   * Integrates with game engine and automatically saves move to database.
   *
   * @param gameId - Game UUID
   * @param playerId - Player making the move
   * @param move - Move details (from, to)
   * @returns Updated game state
   */
  async makeMove(
    gameId: string,
    playerId: string,
    move: { fromRow: number; fromCol: number; toRow: number; toCol: number }
  ) {
    try {
      const gameData = await gameRepository.findById(gameId);

      if (!gameData) {
        throw new Error('Partida não encontrada');
      }

      // Validate game is in progress
      if (gameData.status !== 'IN_PROGRESS') {
        throw new Error('Partida não está em andamento');
      }

      // Validate it's player's turn
      const playerColor = gameData.whitePlayerId === playerId ? 'WHITE' : 'BLACK';
      if (gameData.currentTurn !== playerColor) {
        throw new Error('Não é seu turno');
      }

      // Validate player is in this game
      if (gameData.whitePlayerId !== playerId && gameData.blackPlayerId !== playerId) {
        throw new Error('Você não está nesta partida');
      }

      // Parse board state
      const boardState = gameData.boardState as unknown as BoardState;

      // Get piece at from position
      const piece = getPieceAt(move.fromRow, move.fromCol, boardState);

      if (!piece) {
        throw new Error('Nenhuma peça encontrada na posição de origem');
      }

      if (piece.color !== playerColor) {
        throw new Error('Você só pode mover suas próprias peças');
      }

      // Convert to Game type for engine
      const gameForEngine: Game = {
        id: gameData.id,
        type: gameData.type as unknown as EngineGameType,
        status: gameData.status as unknown as EngineGameStatus,
        boardState,
        currentTurn: gameData.currentTurn as unknown as Color,
        moveCount: gameData.moveCount,
        result: (gameData.result as unknown as EngineGameResult | null) || null,
        whitePlayerId: gameData.whitePlayerId,
        blackPlayerId: gameData.blackPlayerId,
        botDifficulty: null,
        createdAt: gameData.createdAt,
        updatedAt: gameData.updatedAt,
      };

      // Execute move using game engine
      const moveToExecute = {
        from: { row: move.fromRow, col: move.fromCol },
        to: { row: move.toRow, col: move.toCol },
        pieceId: piece.id,
      };

      const updatedGame = executeMove(moveToExecute, gameForEngine);

      // Check for victory or draw
      const victoryCheck = checkVictory(updatedGame);
      const drawCheck = checkDraw(updatedGame);

      let newStatus = gameData.status as GameStatus;
      let newResult = gameData.result as GameResult | null;

      if (victoryCheck.isVictory) {
        newStatus = GameStatus.FINISHED;
        newResult =
          victoryCheck.winner === Color.WHITE ? GameResult.WHITE_WIN : GameResult.BLACK_WIN;
      } else if (drawCheck.isDraw) {
        newStatus = GameStatus.FINISHED;
        newResult = GameResult.DRAW;
      }

      // Save move to database (automatic save)
      await gameRepository.saveMove(gameData.id, {
        sequenceNumber: gameData.moveCount + 1,
        color: playerColor as Color,
        pieceId: piece.id,
        fromRow: move.fromRow,
        fromCol: move.fromCol,
        toRow: move.toRow,
        toCol: move.toCol,
      });

      // Update game state in database (automatic save)
      await gameRepository.updateBoardState(gameId, updatedGame.boardState);

      // Update status if game ended
      if (newStatus !== gameData.status) {
        await gameRepository.updateStatus(gameId, newStatus, newResult || undefined);

        // Record game result in player statistics
        if (newStatus === GameStatus.FINISHED && newResult) {
          await this.recordPlayerStatistics(gameData, newResult);
        }
      }

      logger.info('Move executed and saved', {
        gameId,
        playerId,
        move,
        sequence: gameData.moveCount + 1,
        newStatus,
      });

      return {
        valid: true,
        boardState: updatedGame.boardState,
        currentTurn: updatedGame.currentTurn,
        status: newStatus,
        result: newResult,
      };
    } catch (error) {
      logger.error('Failed to make move', { error, gameId, playerId, move });

      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Não foi possível executar o movimento');
    }
  }

  /**
   * Player resigns from the game.
   *
   * @param gameId - Game UUID
   * @param playerId - Player resigning
   * @returns Updated game result
   */
  async resignGame(gameId: string, playerId: string) {
    try {
      const game = await gameRepository.findById(gameId);

      if (!game) {
        throw new Error('Partida não encontrada');
      }

      // Validate game is in progress
      if (game.status !== 'IN_PROGRESS') {
        throw new Error('Partida não está em andamento');
      }

      // Validate player is in this game
      if (game.whitePlayerId !== playerId && game.blackPlayerId !== playerId) {
        throw new Error('Você não está nesta partida');
      }

      // Determine winner (opposite of resigning player)
      const result = game.whitePlayerId === playerId ? 'BLACK_WINS' : 'WHITE_WINS';

      await gameRepository.updateStatus(gameId, 'FINISHED' as GameStatus, result as GameResult);

      logger.info(`Player ${playerId} resigned from game ${gameId}`);

      return {
        status: 'FINISHED',
        result,
        resignedBy: playerId,
      };
    } catch (error) {
      logger.error('Failed to resign game', { error, gameId, playerId });

      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Não foi possível desistir da partida');
    }
  }

  /**
   * Helper method to get the next move number for a game.
   * (Currently unused - reserved for future full game engine integration)
   */
  private async getNextMoveNumber(gameId: string): Promise<number> {
    const game = await gameRepository.findById(gameId, true);
    return game?.moves ? game.moves.length + 1 : 1;
  }

  /**
   * Records game result in player statistics.
   * Updates wins/losses/draws for both players.
   */
  private async recordPlayerStatistics(
    gameData: { whitePlayerId: string | null; blackPlayerId: string | null },
    result: GameResult
  ): Promise<void> {
    try {
      if (!gameData.whitePlayerId || !gameData.blackPlayerId) {
        return; // Skip if players are missing
      }

      if (result === GameResult.WHITE_WIN) {
        await playerService.recordGameResult(gameData.whitePlayerId, 'WIN', 'ONLINE');
        await playerService.recordGameResult(gameData.blackPlayerId, 'LOSS', 'ONLINE');
      } else if (result === GameResult.BLACK_WIN) {
        await playerService.recordGameResult(gameData.blackPlayerId, 'WIN', 'ONLINE');
        await playerService.recordGameResult(gameData.whitePlayerId, 'LOSS', 'ONLINE');
      } else if (result === GameResult.DRAW) {
        await playerService.recordGameResult(gameData.whitePlayerId, 'DRAW', 'ONLINE');
        await playerService.recordGameResult(gameData.blackPlayerId, 'DRAW', 'ONLINE');
      }

      logger.info('Player statistics updated', { result });
    } catch (error) {
      logger.error('Failed to update player statistics', { error, result });
      // Don't throw - statistics update failure shouldn't break game flow
    }
  }
}

// Export singleton instance
export const gameService = new GameService();
