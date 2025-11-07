/**
 * T085: Teste de reconexão WebSocket
 *
 * Garante que a desconexão de um jogador em uma partida online notifica o
 * adversário e que, ao reconectar com o mesmo token de sessão, o servidor
 * restabelece o estado da partida conforme especificação de reconexão.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { io as createClient, Socket } from 'socket.io-client';
import { WS_EVENTS } from '@/lib/constants';
import {
  API_BASE_URL,
  PlayerCredentials,
  createPlayerSession,
  createRoom,
  generateTestEmail,
  generateTestUsername,
} from '../api/helpers';

const prisma = new PrismaClient();
const createdRoomIds: string[] = [];
const createdGameIds: string[] = [];
const createdPlayerEmails = new Set<string>();

const SOCKET_BASE_URL = 'http://localhost:3000';

jest.setTimeout(45000);

type JoinRoomPayload = { roomCode: string; gameId?: string };

type ClientEmitEvents = {
  'room:join': (payload: JoinRoomPayload) => void;
};

type ClientListenEvents = {
  'room:joined': (payload: unknown) => void;
  'player:disconnected': (payload: unknown) => void;
  'player:reconnected': (payload: unknown) => void;
  'game:state': (payload: unknown) => void;
  [event: string]: (...args: unknown[]) => void;
};

type ClientSocket = Socket<ClientListenEvents, ClientEmitEvents>;

describe('WebSocket Reconnection Flow', () => {
  const hostCredentials: PlayerCredentials = {
    email: generateTestEmail('ws-reconnect-host'),
    username: generateTestUsername('WsRecHost'),
    password: 'WsRecHost123!',
  };

  const guestCredentials: PlayerCredentials = {
    email: generateTestEmail('ws-reconnect-guest'),
    username: generateTestUsername('WsRecGuest'),
    password: 'WsRecGuest123!',
  };

  let hostSessionToken: string;
  let guestSessionToken: string;

  const activeSockets: ClientSocket[] = [];

  beforeAll(async () => {
    createdPlayerEmails.add(hostCredentials.email);
    createdPlayerEmails.add(guestCredentials.email);

    const hostSession = await createPlayerSession(hostCredentials);
    hostSessionToken = hostSession.sessionToken;

    const guestSession = await createPlayerSession(guestCredentials);
    guestSessionToken = guestSession.sessionToken;
  });

  afterEach(() => {
    for (const socket of activeSockets) {
      if (socket.connected) {
        socket.disconnect();
      }
    }
    activeSockets.length = 0;
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

  function connectSocket(sessionToken: string): Promise<ClientSocket> {
    return new Promise((resolve, reject) => {
      const socket = createClient(SOCKET_BASE_URL, {
        transports: ['websocket'],
        auth: { sessionToken },
      }) as ClientSocket;

      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Timeout ao conectar socket'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        activeSockets.push(socket);
        resolve(socket);
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      socket.on('authError', (error: unknown) => {
        clearTimeout(timeout);
        const message = (error as { message?: string } | undefined)?.message ?? 'Desconhecido';
        reject(new Error(`Erro de autenticação WS: ${message}`));
      });
    });
  }

  async function setupOnlineGame() {
    const roomResponse = await createRoom(hostSessionToken);
    createdRoomIds.push(roomResponse.roomId);
    createdGameIds.push(roomResponse.gameId);

    const joinResponse = await fetch(`${API_BASE_URL}/rooms/${roomResponse.code}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session-token=${guestSessionToken}`,
      },
    });

    expect(joinResponse.status).toBe(200);
    await joinResponse.json();

    const createGameResponse = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session-token=${hostSessionToken}`,
      },
      body: JSON.stringify({ type: 'ONLINE', roomCode: roomResponse.code }),
    });

    expect(createGameResponse.status).toBe(201);
    const createdGame = await createGameResponse.json();

    return { room: roomResponse, game: createdGame };
  }

  it('deve notificar desconexão e reconexão do jogador', async () => {
    const { room, game } = await setupOnlineGame();

    const [hostSocket, guestSocket] = await Promise.all([
      connectSocket(hostSessionToken),
      connectSocket(guestSessionToken),
    ]);

    const hostJoined = new Promise((resolve) => hostSocket.once(WS_EVENTS.ROOM_JOINED, resolve));
    const guestJoined = new Promise((resolve) => guestSocket.once(WS_EVENTS.ROOM_JOINED, resolve));

    hostSocket.emit(WS_EVENTS.JOIN_ROOM, { roomCode: room.code });
    guestSocket.emit(WS_EVENTS.JOIN_ROOM, { roomCode: room.code });

    await Promise.all([hostJoined, guestJoined]);

    const disconnectNotification = new Promise((resolve) =>
      guestSocket.once(WS_EVENTS.PLAYER_DISCONNECTED, resolve)
    );

    hostSocket.disconnect();

    const disconnectPayload = (await disconnectNotification) as {
      playerId: string;
      username: string;
      color: string;
      disconnectedAt: string;
    };

    expect(disconnectPayload.playerId).toBeDefined();
    expect(disconnectPayload.username).toBeDefined();
    expect(disconnectPayload.color).toMatch(/WHITE|BLACK/);
    expect(new Date(disconnectPayload.disconnectedAt).getTime()).not.toBeNaN();

    const reconnectingSocket = await connectSocket(hostSessionToken);

    const reconnectJoined = new Promise((resolve) =>
      reconnectingSocket.once(WS_EVENTS.ROOM_JOINED, resolve)
    );

    const guestReconnectNotification = new Promise((resolve) =>
      guestSocket.once(WS_EVENTS.PLAYER_RECONNECTED, resolve)
    );

    reconnectingSocket.emit(WS_EVENTS.JOIN_ROOM, {
      roomCode: room.code,
      gameId: game.id,
    });

    await reconnectJoined;

    const reconnectPayload = (await guestReconnectNotification) as {
      playerId: string;
      username: string;
      color: string;
      reconnectedAt: string;
    };

    expect(reconnectPayload.playerId).toBe(disconnectPayload.playerId);
    expect(reconnectPayload.username).toBe(disconnectPayload.username);
    expect(reconnectPayload.color).toBe(disconnectPayload.color);
    expect(new Date(reconnectPayload.reconnectedAt).getTime()).not.toBeNaN();
  });
});
