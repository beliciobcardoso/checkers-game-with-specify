/**
 * T100: WebSocket Handler - Make Move
 *
 * Handles move execution in online game.
 * Validates move, updates game state, and broadcasts to opponent.
 */

import { Socket } from 'socket.io';
import { gameService } from '@/services/GameService';
import { logger } from '@/lib/logger';

interface MakeMoveData {
  gameId: string;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

export async function handleMakeMove(socket: Socket, data: MakeMoveData) {
  try {
    const playerId = socket.data.playerId;

    if (!playerId) {
      socket.emit('error', { message: 'Não autenticado' });
      return;
    }

    // Validate move data
    if (
      !data.gameId ||
      typeof data.fromRow !== 'number' ||
      typeof data.fromCol !== 'number' ||
      typeof data.toRow !== 'number' ||
      typeof data.toCol !== 'number'
    ) {
      socket.emit('error', { message: 'Dados de movimento inválidos' });
      return;
    }

    // Execute move
    const result = await gameService.makeMove(data.gameId, playerId, {
      fromRow: data.fromRow,
      fromCol: data.fromCol,
      toRow: data.toRow,
      toCol: data.toCol,
    });

    // Get updated game state
    const updatedGame = await gameService.getGame(data.gameId);

    // Broadcast move-made to all players in the game room
    // Note: Room code should be stored in socket data when joining
    const roomCode = socket.data.roomCode;

    if (roomCode) {
      socket.to(roomCode).emit('move-made', {
        gameId: data.gameId,
        move: {
          fromRow: data.fromRow,
          fromCol: data.fromCol,
          toRow: data.toRow,
          toCol: data.toCol,
          playerId,
        },
        boardState: updatedGame.boardState,
        currentTurn: updatedGame.currentTurn,
        gameStatus: updatedGame.status,
      });
    }

    // Confirm to the player who made the move
    socket.emit('move-confirmed', {
      gameId: data.gameId,
      boardState: updatedGame.boardState,
      currentTurn: updatedGame.currentTurn,
      gameStatus: updatedGame.status,
      result,
    });

    logger.info(`Move executed in game ${data.gameId} by player ${playerId}`);
  } catch (error) {
    logger.error('Make move handler error', { error, data });
    socket.emit('error', {
      message: error instanceof Error ? error.message : 'Erro ao executar movimento',
    });
  }
}
