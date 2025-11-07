/**
 * T087: Room Repository
 *
 * Data access layer for Room entity (game rooms for online multiplayer).
 * Handles room creation with unique 6-character codes, player management,
 * and status updates following repository pattern for data isolation.
 */

import { prisma } from '@/lib/prisma';
import { Room, RoomStatus, Game, Player, GameType, GameStatus, Color } from '@prisma/client';
import { logger } from '@/lib/logger';

// Type for Room with relations
type RoomWithGame = Room & { game: Game };
type RoomWithGameAndHost = Room & {
  game: Game;
  host: Pick<Player, 'id' | 'username' | 'email'> | null;
};
type RoomWithGameAndPlayers = Room & {
  game: Game & {
    whitePlayer: Pick<Player, 'id' | 'username'> | null;
    blackPlayer: Pick<Player, 'id' | 'username'> | null;
  };
};

/**
 * Generates a unique 6-character alphanumeric room code (uppercase).
 * Format: [A-Z0-9]{6} (e.g., "AB12CD", "XYZ789")
 *
 * Excludes ambiguous characters: 0/O, 1/I to prevent confusion.
 * Retries up to 10 times if code collision occurs (highly unlikely).
 */
async function generateUniqueRoomCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes 0, O, 1, I
  const codeLength = 6;
  const maxRetries = 10;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let code = '';
    for (let i = 0; i < codeLength; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check if code already exists
    const existing = await prisma.room.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }

    logger.warn(`Room code collision: ${code} (attempt ${attempt + 1}/${maxRetries})`);
  }

  throw new Error('Failed to generate unique room code after maximum retries');
}

/**
 * RoomRepository provides data access methods for Room entity.
 * Follows repository pattern to encapsulate Prisma queries.
 */
export class RoomRepository {
  /**
   * Creates a new room with a unique 6-character code.
   * Associates room with host player and creates linked ONLINE game in WAITING status.
   * Room expires 24 hours after creation if game doesn't start.
   *
   * @param hostPlayerId - UUID of the player creating the room
   * @param whitePlayerId - UUID of player who will play as white (typically host)
   * @returns Created room with associated game
   *
   * @throws Error if unable to generate unique code
   * @throws Prisma error if database operation fails
   */
  async create(hostPlayerId: string, whitePlayerId?: string): Promise<RoomWithGameAndHost> {
    const code = await generateUniqueRoomCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      // First create the game
      const game = await prisma.game.create({
        data: {
          type: 'ONLINE' as GameType,
          status: 'WAITING' as GameStatus,
          whitePlayerId: whitePlayerId || hostPlayerId,
          boardState: {
            pieces: [],
            capturedPieces: { white: 0, black: 0 },
            positionHistory: [],
          },
          currentTurn: 'WHITE' as Color,
        },
      });

      // Then create the room linked to the game
      const room = await prisma.room.create({
        data: {
          code,
          status: 'WAITING' as RoomStatus,
          hostPlayerId,
          expiresAt,
          gameId: game.id,
        },
        include: {
          game: true,
          host: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Room created: ${code} by player ${hostPlayerId}, game ${game.id}`);
      return room;
    } catch (error) {
      logger.error('Failed to create room', { error, hostPlayerId, code });
      throw error;
    }
  }

  /**
   * Finds a room by its unique code.
   * Includes associated game and host player information.
   *
   * @param code - 6-character room code (case-insensitive)
   * @returns Room with game and host, or null if not found
   */
  async findByCode(code: string): Promise<RoomWithGameAndHost | null> {
    try {
      const room = await prisma.room.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          game: true,
          host: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });

      return room;
    } catch (error) {
      logger.error('Failed to find room by code', { error, code });
      throw error;
    }
  }

  /**
   * Finds a room by its UUID.
   *
   * @param id - Room UUID
   * @returns Room with game, or null if not found
   */
  async findById(id: string): Promise<RoomWithGame | null> {
    try {
      const room = await prisma.room.findUnique({
        where: { id },
        include: {
          game: true,
        },
      });

      return room;
    } catch (error) {
      logger.error('Failed to find room by ID', { error, id });
      throw error;
    }
  }

  /**
   * Adds a second player to a room and starts the game.
   * Updates room status to ACTIVE and game status to IN_PROGRESS.
   * Assigns second player as BLACK (host/first player is WHITE).
   *
   * @param code - Room code
   * @param playerId - UUID of player joining
   * @returns Updated room with game
   *
   * @throws Error if room not found, already full, or expired
   */
  async addPlayer(code: string, playerId: string): Promise<RoomWithGameAndPlayers> {
    const room = await this.findByCode(code);

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.game.blackPlayerId) {
      throw new Error('Room is full');
    }

    if (room.hostPlayerId === playerId) {
      throw new Error('Cannot join your own room');
    }

    if (room.expiresAt < new Date()) {
      throw new Error('Room has expired');
    }

    try {
      const updatedRoom = await prisma.room.update({
        where: { id: room.id },
        data: {
          status: 'ACTIVE',
          game: {
            update: {
              blackPlayerId: playerId,
              status: 'IN_PROGRESS',
              // Initialize board with starting positions (will be set by GameService)
            },
          },
        },
        include: {
          game: {
            include: {
              whitePlayer: {
                select: { id: true, username: true },
              },
              blackPlayer: {
                select: { id: true, username: true },
              },
            },
          },
        },
      });

      logger.info(`Player ${playerId} joined room ${code}. Game starting.`);
      return updatedRoom;
    } catch (error) {
      logger.error('Failed to add player to room', { error, code, playerId });
      throw error;
    }
  }

  /**
   * Updates room status.
   *
   * @param id - Room UUID
   * @param status - New status (WAITING, ACTIVE, FINISHED)
   * @returns Updated room
   */
  async updateStatus(id: string, status: RoomStatus): Promise<Room> {
    try {
      const room = await prisma.room.update({
        where: { id },
        data: { status },
      });

      logger.info(`Room ${id} status updated to ${status}`);
      return room;
    } catch (error) {
      logger.error('Failed to update room status', { error, id, status });
      throw error;
    }
  }

  /**
   * Finds all active rooms (status WAITING or ACTIVE).
   * Useful for admin/monitoring purposes.
   *
   * @returns Array of active rooms with game info
   */
  async findActive(): Promise<RoomWithGameAndHost[]> {
    try {
      const rooms = await prisma.room.findMany({
        where: {
          status: {
            in: ['WAITING', 'ACTIVE'],
          },
        },
        include: {
          game: true,
          host: {
            select: { id: true, username: true, email: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return rooms;
    } catch (error) {
      logger.error('Failed to find active rooms', { error });
      throw error;
    }
  }

  /**
   * Deletes expired rooms (older than 24 hours in WAITING status).
   * Should be called periodically by a cron job or cleanup task.
   *
   * @returns Number of deleted rooms
   */
  async deleteExpired(): Promise<number> {
    try {
      const result = await prisma.room.deleteMany({
        where: {
          status: 'WAITING',
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info(`Deleted ${result.count} expired rooms`);
      return result.count;
    } catch (error) {
      logger.error('Failed to delete expired rooms', { error });
      throw error;
    }
  }

  /**
   * Checks if a room code is valid and available.
   *
   * @param code - Room code to validate
   * @returns True if code exists and room is joinable (WAITING status, not expired)
   */
  async isJoinable(code: string): Promise<boolean> {
    const room = await this.findByCode(code);

    if (!room) {
      return false;
    }

    if (room.status !== 'WAITING') {
      return false;
    }

    if (room.expiresAt < new Date()) {
      return false;
    }

    if (room.game.blackPlayerId !== null) {
      return false; // Room is full
    }

    return true;
  }
}

// Export singleton instance
export const roomRepository = new RoomRepository();
