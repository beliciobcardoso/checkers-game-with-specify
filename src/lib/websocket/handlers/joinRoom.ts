/**
 * T099: WebSocket Handler - Join Room
 *
 * Handles player joining a room by code.
 * Validates room, assigns player color, and broadcasts to room members.
 */

import { Socket } from 'socket.io';
import { roomService } from '@/services/RoomService';
import { gameService } from '@/services/GameService';
import { logger } from '@/lib/logger';

interface JoinRoomData {
  roomCode: string;
}

export async function handleJoinRoom(socket: Socket, data: JoinRoomData) {
  try {
    const playerId = socket.data.playerId;

    if (!playerId) {
      socket.emit('error', { message: 'Não autenticado' });
      return;
    }

    if (!data.roomCode || typeof data.roomCode !== 'string') {
      socket.emit('error', { message: 'Código de sala inválido' });
      return;
    }

    const roomCode = data.roomCode.toUpperCase();

    // Get room info before joining
    const roomInfo = await roomService.getRoomByCode(roomCode);

    // Join Socket.IO room
    await socket.join(roomCode);

    // If room is waiting for players, add player to room
    if (roomInfo.status === 'WAITING') {
      const room = await roomService.joinRoom(roomCode, playerId);

      // Get full game details
      const game = await gameService.getGame(room.gameId);

      // Broadcast player-joined to all room members
      socket.to(roomCode).emit('player-joined', {
        player: {
          id: playerId,
          color: room.blackPlayerId === playerId ? 'BLACK' : 'WHITE',
        },
        game: {
          id: game.id,
          boardState: game.boardState,
          currentTurn: game.currentTurn,
          status: game.status,
        },
      });

      // Send room-joined confirmation to joining player
      socket.emit('room-joined', {
        room: {
          id: roomInfo.gameId,
          code: room.code,
          status: room.status,
          players: {
            white: { id: room.whitePlayerId },
            black: { id: room.blackPlayerId },
          },
        },
        game: {
          id: game.id,
          boardState: game.boardState,
          currentTurn: game.currentTurn,
        },
      });

      logger.info(`Player ${playerId} joined room ${roomCode} via WebSocket`);
    } else {
      // Room already active, just rejoin
      const game = await gameService.getGame(roomInfo.gameId);

      socket.emit('room-joined', {
        room: {
          id: roomInfo.gameId,
          code: roomInfo.code,
          status: roomInfo.status,
          players: {
            white: { id: roomInfo.whitePlayerId },
            black: { id: roomInfo.blackPlayerId },
          },
        },
        game: {
          id: game.id,
          boardState: game.boardState,
          currentTurn: game.currentTurn,
        },
      });

      logger.info(`Player ${playerId} rejoined room ${roomCode}`);
    }
  } catch (error) {
    logger.error('Join room handler error', { error, data });
    socket.emit('error', {
      message: error instanceof Error ? error.message : 'Erro ao entrar na sala',
    });
  }
}
