/**
 * T084: Teste de integração WebSocket para partida online
 *
 * Verifica que dois clientes autenticados conseguem ingressar na mesma sala e
 * recebem eventos de movimento em tempo real conforme especificação do contrato
 * WebSocket (specs/001-checkers-game/contracts/websocket.md).
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
import type { BoardState, Piece } from '@/types/game';

const prisma = new PrismaClient();
const createdRoomIds: string[] = [];
const createdGameIds: string[] = [];
const createdPlayerEmails = new Set<string>();

const SOCKET_BASE_URL = 'http://localhost:3000';

jest.setTimeout(45000);

type JoinRoomPayload = { roomCode: string };
type MakeMovePayload = {
  gameId: string;
  move: {
    pieceId: string;
    toRow: number;
    toCol: number;
  };
};

interface ClientEmitEvents {
  'room:join': (payload: JoinRoomPayload) => void;
  'game:move': (payload: MakeMovePayload) => void;
}

interface ClientListenEvents {
  'room:joined': (payload: unknown) => void;
  'game:move': (payload: unknown) => void;
  'game:state': (payload: unknown) => void;
  [event: string]: (...args: unknown[]) => void;
}

type ClientSocket = Socket<ClientListenEvents, ClientEmitEvents>;

describe('WebSocket Online Game Integration', () => {
  const hostCredentials: PlayerCredentials = {
    email: generateTestEmail('ws-host'),
    username: generateTestUsername('WsHost'),
    password: 'WsHostPass123!',
  };

  const guestCredentials: PlayerCredentials = {
    email: generateTestEmail('ws-guest'),
    username: generateTestUsername('WsGuest'),
    password: 'WsGuestPass123!',
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

    const joinResponse = await fetch(
      `${API_BASE_URL}/rooms/${roomResponse.code}/join`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session-token=${guestSessionToken}`,
        },
      }
    );

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

  function extractInitialWhitePiece(boardState: BoardState): Piece {
    const target = boardState.pieces.find(
      (piece) => piece.color === 'WHITE' && piece.row === 5 && piece.col === 0,
    );

    if (!target) {
      throw new Error('Peça inicial branca esperada não encontrada');
    }

    return target;
  }

  it('deve sincronizar movimento de jogo entre dois clientes conectados', async () => {
    const { room, game } = await setupOnlineGame();

    const [hostSocket, guestSocket] = await Promise.all([
      connectSocket(hostSessionToken),
      connectSocket(guestSessionToken),
    ]);

    const hostRoomJoined = new Promise((resolve) =>
      hostSocket.once(WS_EVENTS.ROOM_JOINED, resolve),
    );
    const guestRoomJoined = new Promise((resolve) =>
      guestSocket.once(WS_EVENTS.ROOM_JOINED, resolve),
    );

  hostSocket.emit(WS_EVENTS.JOIN_ROOM, { roomCode: room.code });
  guestSocket.emit(WS_EVENTS.JOIN_ROOM, { roomCode: room.code });

    await Promise.all([hostRoomJoined, guestRoomJoined]);

    const persistedGame = await prisma.game.findUnique({
      where: { id: game.id },
    });

    const boardState = persistedGame?.boardState as unknown as BoardState;
    const movingPiece = extractInitialWhitePiece(boardState);

    const hostMovePromise = new Promise((resolve) =>
      hostSocket.once(WS_EVENTS.GAME_MOVE, resolve),
    );
    const guestMovePromise = new Promise((resolve) =>
      guestSocket.once(WS_EVENTS.GAME_MOVE, resolve),
    );

    const guestStatePromise = new Promise((resolve) =>
      guestSocket.once(WS_EVENTS.GAME_STATE, resolve),
    );

    hostSocket.emit(WS_EVENTS.GAME_MOVE, {
      gameId: game.id,
      move: {
        pieceId: movingPiece.id,
        toRow: movingPiece.row - 1,
        toCol: movingPiece.col + 1,
      },
    });

    const [hostMoveEvent, guestMoveEvent, guestStateEvent] = await Promise.all([
      hostMovePromise,
      guestMovePromise,
      guestStatePromise,
    ]);

    expect(hostMoveEvent).toEqual(guestMoveEvent);

    const payload = guestMoveEvent as {
      move: {
        pieceId: string;
        fromRow: number;
        fromCol: number;
        toRow: number;
        toCol: number;
      };
      game: { currentTurn: string; id: string };
    };

    expect(payload.move.pieceId).toBe(movingPiece.id);
    expect(payload.move.fromRow).toBe(movingPiece.row);
    expect(payload.move.fromCol).toBe(movingPiece.col);
    expect(payload.move.toRow).toBe(movingPiece.row - 1);
    expect(payload.move.toCol).toBe(movingPiece.col + 1);
    expect(payload.game.id).toBe(game.id);
    expect(payload.game.currentTurn).toBe('BLACK');

    const statePayload = guestStateEvent as { boardState: BoardState };
    const updatedPiece = statePayload.boardState.pieces.find(
      (piece) => piece.id === movingPiece.id,
    );

    expect(updatedPiece?.row).toBe(movingPiece.row - 1);
    expect(updatedPiece?.col).toBe(movingPiece.col + 1);
  });
});
