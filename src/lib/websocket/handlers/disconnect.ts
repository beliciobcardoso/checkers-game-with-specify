/**
 * T101: WebSocket Handler - Disconnect
 *
 * Handles player disconnection.
 * Notifies opponent and starts 5-minute timeout timer.
 */

import { Socket } from 'socket.io';
import { logger } from '@/lib/logger';
import { gameService } from '@/services/GameService';

const DISCONNECT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Store timeout timers
const disconnectTimers = new Map<string, NodeJS.Timeout>();

export function handleDisconnect(socket: Socket) {
  const playerId = socket.data.playerId;
  const roomCode = socket.data.roomCode;
  const gameId = socket.data.gameId;

  if (!playerId) {
    return;
  }

  logger.info(`Player ${playerId} disconnected from WebSocket`);

  // Notify opponent in the room
  if (roomCode && gameId) {
    socket.to(roomCode).emit('opponent-disconnected', {
      playerId,
      timestamp: new Date().toISOString(),
      reconnectWindow: DISCONNECT_TIMEOUT,
    });

    // Start disconnect timeout
    const timer = setTimeout(async () => {
      try {
        // After 5 minutes, declare opponent as abandoned
        // Update game status to finished with opponent as winner
        const game = await gameService.getGame(gameId);

        if (game && game.status === 'IN_PROGRESS') {
          // Determine winner (opposite of disconnected player)
          const disconnectedPlayerColor = game.whitePlayerId === playerId ? 'WHITE' : 'BLACK';
          const winnerId =
            disconnectedPlayerColor === 'WHITE' ? game.blackPlayerId : game.whitePlayerId;

          // Mark game as abandoned with winner
          await gameService.resignGame(gameId, playerId);

          socket.to(roomCode).emit('opponent-abandoned', {
            playerId,
            winnerId,
            message: 'Oponente não reconectou a tempo - Vitória por W.O.',
          });

          logger.info(`Player ${playerId} abandon timeout reached - game ${gameId} ended by W.O.`);
        }
      } catch (error) {
        logger.error('Error handling abandon timeout', { error, playerId, gameId });
      }

      disconnectTimers.delete(playerId);
    }, DISCONNECT_TIMEOUT);

    disconnectTimers.set(playerId, timer);
  }
}

/**
 * Cancel disconnect timer (called during reconnect).
 */
export function cancelDisconnectTimer(playerId: string) {
  const timer = disconnectTimers.get(playerId);

  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(playerId);
    logger.info(`Disconnect timer cancelled for player ${playerId}`);
  }
}
