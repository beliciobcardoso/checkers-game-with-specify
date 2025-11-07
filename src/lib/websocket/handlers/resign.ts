/**
 * T103: WebSocket Handler - Resign
 *
 * Handles player resignation.
 * Updates game status and broadcasts to opponent.
 */

import { Socket } from 'socket.io';
import { gameService } from '@/services/GameService';
import { logger } from '@/lib/logger';

interface ResignData {
  gameId: string;
}

export async function handleResign(socket: Socket, data: ResignData) {
  try {
    const playerId = socket.data.playerId;

    if (!playerId) {
      socket.emit('error', { message: 'Não autenticado' });
      return;
    }

    if (!data.gameId) {
      socket.emit('error', { message: 'ID da partida inválido' });
      return;
    }

    // Resign from game
    const result = await gameService.resignGame(data.gameId, playerId);

    // Get room code from socket data
    const roomCode = socket.data.roomCode;

    if (roomCode) {
      // Broadcast resignation to opponent
      socket.to(roomCode).emit('opponent-resigned', {
        gameId: data.gameId,
        resignedPlayerId: playerId,
        result: result.result,
        status: result.status,
      });
    }

    // Confirm resignation to resigning player
    socket.emit('resign-confirmed', {
      gameId: data.gameId,
      result: result.result,
      status: result.status,
    });

    logger.info(`Player ${playerId} resigned from game ${data.gameId}`);
  } catch (error) {
    logger.error('Resign handler error', { error, data });
    socket.emit('error', {
      message: error instanceof Error ? error.message : 'Erro ao desistir da partida',
    });
  }
}
