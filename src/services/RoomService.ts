/**
 * T089: Room Service
 *
 * Business logic layer for room management.
 * Handles room creation, player joining, status updates,
 * and validation rules for online multiplayer.
 */

import { roomRepository } from '@/lib/db/repositories/room';
import { logger } from '@/lib/logger';
import { RoomStatus } from '@prisma/client';

export class RoomService {
  /**
   * Creates a new room for online multiplayer.
   *
   * @param hostPlayerId - ID of the player creating the room
   * @param whitePlayerId - Optional ID to assign as white player (defaults to host)
   * @returns Created room with code
   */
  async createRoom(hostPlayerId: string, whitePlayerId?: string) {
    try {
      const room = await roomRepository.create(hostPlayerId, whitePlayerId);

      logger.info(`Room created: ${room.code} by player ${hostPlayerId}`);

      return {
        code: room.code,
        status: room.status,
        hostId: room.hostPlayerId,
        gameId: room.gameId,
        expiresAt: room.expiresAt,
      };
    } catch (error) {
      logger.error('Failed to create room', { error, hostPlayerId });
      throw new Error('Não foi possível criar a sala');
    }
  }

  /**
   * Allows a player to join a room by code.
   *
   * @param code - 6-character room code
   * @param playerId - ID of the player joining
   * @returns Updated room with game status
   */
  async joinRoom(code: string, playerId: string) {
    try {
      // Validate room is joinable
      const isJoinable = await roomRepository.isJoinable(code);
      if (!isJoinable) {
        throw new Error('Sala não disponível para entrada');
      }

      // Check if room exists
      const existingRoom = await roomRepository.findByCode(code);
      if (!existingRoom) {
        throw new Error('Sala não encontrada');
      }

      // Prevent host from joining own room
      if (existingRoom.hostPlayerId === playerId) {
        throw new Error('Você já está na sala como host');
      }

      // Add player to room
      const room = await roomRepository.addPlayer(code, playerId);

      logger.info(`Player ${playerId} joined room ${code}`);

      return {
        code: room.code,
        status: room.status,
        gameId: room.gameId,
        whitePlayerId: room.game.whitePlayerId,
        blackPlayerId: room.game.blackPlayerId,
      };
    } catch (error) {
      logger.error('Failed to join room', { error, code, playerId });

      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Não foi possível entrar na sala');
    }
  }

  /**
   * Gets room details by code.
   *
   * @param code - 6-character room code
   * @returns Room with game and host information
   */
  async getRoomByCode(code: string) {
    try {
      const room = await roomRepository.findByCode(code);

      if (!room) {
        throw new Error('Sala não encontrada');
      }

      return {
        code: room.code,
        status: room.status,
        hostId: room.hostPlayerId,
        hostUsername: room.host?.username || 'Desconhecido',
        gameId: room.gameId,
        gameStatus: room.game.status,
        whitePlayerId: room.game.whitePlayerId,
        blackPlayerId: room.game.blackPlayerId,
        expiresAt: room.expiresAt,
      };
    } catch (error) {
      logger.error('Failed to get room by code', { error, code });

      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Não foi possível obter informações da sala');
    }
  }

  /**
   * Lists all active rooms (WAITING or ACTIVE).
   *
   * @returns Array of active rooms
   */
  async listActiveRooms() {
    try {
      const rooms = await roomRepository.findActive();

      return rooms.map((room) => ({
        code: room.code,
        status: room.status,
        hostUsername: room.host?.username || 'Desconhecido',
        gameStatus: room.game.status,
        expiresAt: room.expiresAt,
      }));
    } catch (error) {
      logger.error('Failed to list active rooms', { error });
      throw new Error('Não foi possível listar salas ativas');
    }
  }

  /**
   * Updates room status.
   *
   * @param roomId - Room UUID
   * @param status - New status (WAITING, ACTIVE, FINISHED)
   * @returns Updated room
   */
  async updateRoomStatus(roomId: string, status: RoomStatus) {
    try {
      const room = await roomRepository.updateStatus(roomId, status);

      logger.info(`Room ${roomId} status updated to ${status}`);

      return {
        id: room.id,
        code: room.code,
        status: room.status,
      };
    } catch (error) {
      logger.error('Failed to update room status', { error, roomId, status });
      throw new Error('Não foi possível atualizar status da sala');
    }
  }

  /**
   * Deletes expired rooms (for cleanup jobs).
   *
   * @returns Count of deleted rooms
   */
  async cleanupExpiredRooms() {
    try {
      const count = await roomRepository.deleteExpired();

      if (count > 0) {
        logger.info(`Cleaned up ${count} expired rooms`);
      }

      return { deletedCount: count };
    } catch (error) {
      logger.error('Failed to cleanup expired rooms', { error });
      throw new Error('Não foi possível limpar salas expiradas');
    }
  }
}

// Export singleton instance
export const roomService = new RoomService();
