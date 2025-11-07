/**
 * T079: Teste de contrato para POST /api/rooms
 *
 * Verifica que o endpoint cria uma sala online com código único de 6 caracteres,
 * associa a sala ao jogador autenticado e inicializa uma partida ONLINE em estado WAITING.
 *
 * T080: Teste de contrato para POST /api/rooms/{code}/join
 *
 * Garante que um segundo jogador autenticado consegue entrar na sala, que o jogo é
 * promovido para IN_PROGRESS e que erros esperados (401, 404, 409) são retornados corretamente.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import {
  API_BASE_URL,
  PlayerCredentials,
  createPlayerSession,
  createRoom,
  generateRandomRoomCode,
  generateTestEmail,
  generateTestUsername,
} from './helpers';

const prisma = new PrismaClient();

const createdRoomIds: string[] = [];
const createdGameIds: string[] = [];
const createdPlayerEmails = new Set<string>();

describe('Rooms API Endpoints', () => {
  const hostCredentials: PlayerCredentials = {
    email: generateTestEmail('room-host'),
    username: generateTestUsername('RoomHost'),
    password: 'RoomHostPass123!',
  };

  let hostSessionToken: string;
  let hostPlayerId: string;

  beforeAll(async () => {
    // Criar jogador host autenticado
    createdPlayerEmails.add(hostCredentials.email);
    const hostSession = await createPlayerSession(hostCredentials);
    hostPlayerId = hostSession.playerId;
    hostSessionToken = hostSession.sessionToken;
  });

  afterAll(async () => {
    if (createdRoomIds.length > 0) {
      await prisma.room.deleteMany({ where: { id: { in: createdRoomIds } } });
    }

    if (createdGameIds.length > 0) {
      await prisma.game.deleteMany({ where: { id: { in: createdGameIds } } });
    }

    if (createdPlayerEmails.size > 0) {
      await prisma.player.deleteMany({
        where: { email: { in: Array.from(createdPlayerEmails) } },
      });
    }

    await prisma.$disconnect();
  });

  describe('POST /api/rooms', () => {
    it('should create room with unique 6-character code for authenticated player', async () => {
      const data = await createRoom(hostSessionToken);
      createdRoomIds.push(data.roomId);
      createdGameIds.push(data.gameId);

      expect(typeof data.roomId).toBe('string');
      expect(typeof data.gameId).toBe('string');
      expect(typeof data.code).toBe('string');
      expect(data.status).toBe('WAITING');
      expect(data.code).toHaveLength(6);
      expect(/^[A-Z0-9]{6}$/.test(data.code)).toBe(true);

      // Validar dados persistidos
      const room = await prisma.room.findUnique({
        where: { id: data.roomId },
        include: { game: true },
      });

      expect(room).not.toBeNull();
      expect(room?.code).toBe(data.code);
      expect(room?.status).toBe('WAITING');
      expect(room?.hostPlayerId).toBe(hostPlayerId);
      expect(room?.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(room?.gameId).toBe(data.gameId);

      expect(room?.game).not.toBeNull();
      expect(room?.game?.type).toBe('ONLINE');
      expect(room?.game?.status).toBe('WAITING');
      expect(room?.game?.whitePlayerId).toBe(hostPlayerId);
      expect(room?.game?.blackPlayerId).toBeNull();
    });

    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`${API_BASE_URL}/rooms`, {
        method: 'POST',
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Não autenticado');
    });

    it('should generate different codes for sequential room creation', async () => {
      const firstRoom = await createRoom(hostSessionToken);
      const secondRoom = await createRoom(hostSessionToken);

      createdRoomIds.push(firstRoom.roomId, secondRoom.roomId);
      createdGameIds.push(firstRoom.gameId, secondRoom.gameId);

      expect(firstRoom.code).not.toBe(secondRoom.code);
      expect(firstRoom.code).toHaveLength(6);
      expect(secondRoom.code).toHaveLength(6);
    });
  });

  describe('POST /api/rooms/[code]/join', () => {
    const joinerCredentials: PlayerCredentials = {
      email: generateTestEmail('room-joiner'),
      username: generateTestUsername('RoomJoin'),
      password: 'RoomJoinerPass123!',
    };

    let joinerSessionToken: string;
    let joinerPlayerId: string;

    beforeAll(async () => {
      const joinerSession = await createPlayerSession(joinerCredentials);
      createdPlayerEmails.add(joinerCredentials.email);
      joinerPlayerId = joinerSession.playerId;
      joinerSessionToken = joinerSession.sessionToken;
    });

    it('should allow authenticated player to join existing room', async () => {
      const roomData = await createRoom(hostSessionToken);
      createdRoomIds.push(roomData.roomId);
      createdGameIds.push(roomData.gameId);

      const response = await fetch(`${API_BASE_URL}/rooms/${roomData.code}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session-token=${joinerSessionToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.room.id).toBe(roomData.roomId);
      expect(data.room.code).toBe(roomData.code);
      expect(data.room.status).toBe('ACTIVE');
      expect(data.room.hostPlayerId).toBe(hostPlayerId);

      expect(data.game.id).toBe(roomData.gameId);
      expect(data.game.status).toBe('IN_PROGRESS');
      expect(data.game.type).toBe('ONLINE');
      expect(data.game.whitePlayerId).toBe(hostPlayerId);
      expect(data.game.blackPlayerId).toBe(joinerPlayerId);

      const persistedRoom = await prisma.room.findUnique({
        where: { id: roomData.roomId },
        include: { game: true },
      });

      expect(persistedRoom?.status).toBe('ACTIVE');
      expect(persistedRoom?.game?.status).toBe('IN_PROGRESS');
      expect(persistedRoom?.game?.blackPlayerId).toBe(joinerPlayerId);
    });

    it('should reject unauthenticated join attempts', async () => {
      const roomData = await createRoom(hostSessionToken);
      createdRoomIds.push(roomData.roomId);
      createdGameIds.push(roomData.gameId);

      const response = await fetch(`${API_BASE_URL}/rooms/${roomData.code}/join`, {
        method: 'POST',
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Não autenticado');
    });

    it('should return 404 for invalid room code', async () => {
      let invalidCode = '';

      while (true) {
        const candidate = generateRandomRoomCode();
        const existingRoom = await prisma.room.findUnique({
          where: { code: candidate },
        });

        if (!existingRoom) {
          invalidCode = candidate;
          break;
        }
      }

      const response = await fetch(`${API_BASE_URL}/rooms/${invalidCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session-token=${joinerSessionToken}`,
        },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Sala não encontrada');
    });

    it('should return 409 when room already has two players', async () => {
      const roomData = await createRoom(hostSessionToken);
      createdRoomIds.push(roomData.roomId);
      createdGameIds.push(roomData.gameId);

      const firstJoinResponse = await fetch(`${API_BASE_URL}/rooms/${roomData.code}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session-token=${joinerSessionToken}`,
        },
      });

      expect(firstJoinResponse.status).toBe(200);
      await firstJoinResponse.json();

      const extraCredentials: PlayerCredentials = {
        email: generateTestEmail('room-extra'),
        username: generateTestUsername('RoomExtra'),
        password: 'RoomExtraPass123!',
      };

      const extraSession = await createPlayerSession(extraCredentials);
      createdPlayerEmails.add(extraCredentials.email);

      const secondJoinResponse = await fetch(`${API_BASE_URL}/rooms/${roomData.code}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session-token=${extraSession.sessionToken}`,
        },
      });

      expect(secondJoinResponse.status).toBe(409);
      const errorData = await secondJoinResponse.json();
      expect(errorData.error).toContain('Sala cheia');
    });
  });
});
