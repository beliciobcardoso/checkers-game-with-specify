/**
 * T102: WebSocket Handler - Reconnect
 *
 * Handles player reconnection after disconnect.
 * Cancels timeout timer and restores game state.
 */

import { Socket } from 'socket.io';
import { gameService } from '@/services/GameService';
import { cancelDisconnectTimer } from './disconnect';
import { logger } from '@/lib/logger';

interface ReconnectData {
  gameId: string;
  roomCode: string;
}

export async function handleReconnect(socket: Socket, data: ReconnectData) {
  try {
    const playerId = socket.data.playerId;

    if (!playerId) {
      socket.emit('error', { message: 'Não autenticado' });
      return;
    }

    if (!data.gameId || !data.roomCode) {
      socket.emit('error', { message: 'Dados de reconexão inválidos' });
      return;
    }

    // Cancel disconnect timeout
    cancelDisconnectTimer(playerId);

    // Rejoin Socket.IO room
    await socket.join(data.roomCode);
    socket.data.roomCode = data.roomCode;

    // Get current game state
    const game = await gameService.getGame(data.gameId);

    // Notify opponent of reconnection
    socket.to(data.roomCode).emit('opponent-reconnected', {
      playerId,
      timestamp: new Date().toISOString(),
    });

    // Send current game state to reconnected player
    socket.emit('reconnected', {
      gameId: game.id,
      boardState: game.boardState,
      currentTurn: game.currentTurn,
      status: game.status,
      whitePlayerId: game.whitePlayerId,
      blackPlayerId: game.blackPlayerId,
    });

    logger.info(`Player ${playerId} reconnected to game ${data.gameId}`);
  } catch (error) {
    logger.error('Reconnect handler error', { error, data });
    socket.emit('error', {
      message: error instanceof Error ? error.message : 'Erro ao reconectar',
    });
  }
}
