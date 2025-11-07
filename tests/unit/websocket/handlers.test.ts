/**
 * T083: Testes unitários para handlers WebSocket (join-room, make-move, disconnect)
 *
 * Define o comportamento esperado dos handlers Socket.io responsáveis por
 * sincronização de salas e partidas online. Estes testes guiam a implementação
 * garantindo que eventos corretos sejam emitidos e que erros sejam tratados
 * conforme especificação em specs/001-checkers-game/contracts/websocket.md.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { Socket, Server as SocketIOServer } from 'socket.io';
import { WS_EVENTS, ERROR_MESSAGES } from '@/lib/constants';
import { ValidationError, AppError, NotFoundError } from '@/lib/errors';
// @ts-expect-error Handlers serão implementados na Fase 5
import { joinRoomHandler } from '@/lib/websocket/handlers/joinRoom';
// @ts-expect-error Handlers serão implementados na Fase 5
import { makeMoveHandler } from '@/lib/websocket/handlers/makeMove';
// @ts-expect-error Handlers serão implementados na Fase 5
import { disconnectHandler } from '@/lib/websocket/handlers/disconnect';

const GAME_ROOM_PREFIX = 'game:';

function createMockSocket(overrides: Partial<Socket> = {}): Socket {
  const joinMock = jest.fn(async () => undefined) as unknown as Socket['join'];
  const leaveMock = jest.fn(async () => undefined) as unknown as Socket['leave'];
  const emitMock = jest.fn(() => true) as unknown as Socket['emit'];

  const base = {
    id: 'socket-1',
    data: { playerId: 'player-1' },
    join: joinMock,
    leave: leaveMock,
    emit: emitMock,
  } satisfies Partial<Socket> & { data: { playerId: string } };

  return {
    ...base,
    ...overrides,
  } as unknown as Socket;
}

function createMockIo() {
  const emit = jest.fn();
  const to = jest.fn().mockReturnValue({ emit });
  const io = {
    to,
  } as unknown as SocketIOServer;

  return { io, emit, to };
}

describe('WebSocket Handlers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('joinRoomHandler', () => {
    it('deve associar socket à sala, confirmar entrada e broadcast do jogador', async () => {
      const { io, emit: broadcastEmit, to } = createMockIo();
      const socket = createMockSocket();

      const joinRoom = jest.fn(async () => ({
        room: {
          id: 'room-1',
          code: 'ABC123',
          status: 'ACTIVE',
          gameId: 'game-1',
          players: {
            white: { id: 'player-1', username: 'Host' },
            black: { id: 'player-2', username: 'Guest' },
          },
        },
        game: {
          id: 'game-1',
          boardState: {
            pieces: [],
            capturedPieces: { white: 0, black: 0 },
            positionHistory: [],
          },
          currentTurn: 'WHITE',
          status: 'IN_PROGRESS',
        },
        player: {
          id: 'player-1',
          username: 'Host',
          color: 'WHITE',
        },
      })) as jest.MockedFunction<(payload: unknown) => Promise<unknown>>;

      const roomService = { joinRoom };

      const handler = joinRoomHandler({
        io,
        socket,
        roomService: roomService as unknown,
      });

      await handler({ roomCode: 'ABC123' });

      expect(roomService.joinRoom).toHaveBeenCalledWith({
        roomCode: 'ABC123',
        playerId: 'player-1',
        socketId: 'socket-1',
      });
      expect(socket.join).toHaveBeenCalledWith(`${GAME_ROOM_PREFIX}game-1`);
      expect(socket.emit).toHaveBeenCalledWith(
        WS_EVENTS.ROOM_JOINED,
        expect.objectContaining({
          room: expect.objectContaining({ code: 'ABC123' }),
          game: expect.objectContaining({ id: 'game-1' }),
        })
      );

      expect(to).toHaveBeenCalledWith(`${GAME_ROOM_PREFIX}game-1`);
      expect(broadcastEmit).toHaveBeenCalledWith(
        WS_EVENTS.PLAYER_JOINED,
        expect.objectContaining({
          player: expect.objectContaining({ id: 'player-1', username: 'Host' }),
          game: expect.objectContaining({ id: 'game-1' }),
        })
      );
    });

    it('deve emitir erro quando sala não for encontrada ou estiver indisponível', async () => {
      const { io } = createMockIo();
      const socket = createMockSocket();
      const joinRoom = jest.fn(async () => {
        throw new NotFoundError(ERROR_MESSAGES.ROOM_NOT_FOUND);
      }) as jest.MockedFunction<(payload: unknown) => Promise<unknown>>;

      const roomService = { joinRoom };

      const handler = joinRoomHandler({
        io,
        socket,
        roomService: roomService as unknown,
      });

      await handler({ roomCode: 'ERR404' });

      expect(socket.join).not.toHaveBeenCalled();
      expect(socket.emit).toHaveBeenCalledWith(
        WS_EVENTS.ROOM_ERROR,
        expect.objectContaining({ message: ERROR_MESSAGES.ROOM_NOT_FOUND })
      );
    });
  });

  describe('makeMoveHandler', () => {
    it('deve executar movimento e broadcast para toda a sala', async () => {
      const { io, emit: broadcastEmit, to } = createMockIo();
      const socket = createMockSocket();

      const movePayload = {
        pieceId: 'w1',
        toRow: 4,
        toCol: 1,
      };

      const executeMove = jest.fn(async () => ({
        move: {
          id: 'move-1',
          sequenceNumber: 1,
          color: 'WHITE',
          pieceId: 'w1',
          fromRow: 5,
          fromCol: 0,
          toRow: 4,
          toCol: 1,
          capturedPieces: [],
          wasPromotion: false,
          timestamp: new Date().toISOString(),
        },
        game: {
          id: 'game-1',
          boardState: {
            pieces: [],
            capturedPieces: { white: 0, black: 0 },
            positionHistory: [],
          },
          currentTurn: 'BLACK',
          status: 'IN_PROGRESS',
        },
      })) as jest.MockedFunction<(payload: unknown) => Promise<unknown>>;

      const gameService = { executeMove };

      const handler = makeMoveHandler({
        io,
        socket,
        gameService: gameService as unknown,
      });

      await handler({ gameId: 'game-1', move: movePayload });

      expect(gameService.executeMove).toHaveBeenCalledWith({
        gameId: 'game-1',
        playerId: 'player-1',
        move: movePayload,
      });

      expect(to).toHaveBeenCalledWith(`${GAME_ROOM_PREFIX}game-1`);
      expect(broadcastEmit).toHaveBeenCalledWith(
        WS_EVENTS.GAME_MOVE,
        expect.objectContaining({
          move: expect.objectContaining({ id: 'move-1', pieceId: 'w1' }),
          game: expect.objectContaining({ currentTurn: 'BLACK' }),
        })
      );
      expect(broadcastEmit).toHaveBeenCalledWith(
        WS_EVENTS.GAME_STATE,
        expect.objectContaining({ id: 'game-1', currentTurn: 'BLACK' })
      );
    });

    it('deve informar movimento inválido ao jogador atual', async () => {
      const { io } = createMockIo();
      const socket = createMockSocket();

      const invalidMoveError = new ValidationError(ERROR_MESSAGES.INVALID_MOVE);
      (invalidMoveError as ValidationError & { details?: unknown }).details = {
        validMoves: [{ row: 4, col: 1 }],
      };

      const executeMove = jest.fn(async () => {
        throw invalidMoveError;
      }) as jest.MockedFunction<(payload: unknown) => Promise<unknown>>;

      const gameService = { executeMove };

      const handler = makeMoveHandler({
        io,
        socket,
        gameService: gameService as unknown,
      });

      await handler({ gameId: 'game-1', move: { pieceId: 'w1', toRow: 5, toCol: 0 } });

      expect(socket.emit).toHaveBeenCalledWith(
        'move-invalid',
        expect.objectContaining({
          error: ERROR_MESSAGES.INVALID_MOVE,
          validMoves: expect.arrayContaining([{ row: 4, col: 1 }]),
        })
      );
    });

    it('deve encaminhar erro "não é sua vez" como evento genérico', async () => {
      const { io } = createMockIo();
      const socket = createMockSocket();

      const notYourTurnError = new AppError(403, ERROR_MESSAGES.NOT_YOUR_TURN);
      const executeMove = jest.fn(async () => {
        throw notYourTurnError;
      }) as jest.MockedFunction<(payload: unknown) => Promise<unknown>>;

      const gameService = { executeMove };

      const handler = makeMoveHandler({
        io,
        socket,
        gameService: gameService as unknown,
      });

      await handler({ gameId: 'game-1', move: { pieceId: 'b1', toRow: 3, toCol: 0 } });

      expect(socket.emit).toHaveBeenCalledWith(
        WS_EVENTS.ERROR,
        expect.objectContaining({ message: ERROR_MESSAGES.NOT_YOUR_TURN })
      );
    });
  });

  describe('disconnectHandler', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('deve notificar adversário e agendar abandono após 5 minutos', async () => {
      const { io, emit: broadcastEmit, to } = createMockIo();
      const socket = createMockSocket();
      const disconnectAt = new Date('2025-01-01T12:00:00.000Z');

      const handleDisconnect = jest.fn(async () => ({
        gameId: 'game-1',
        roomCode: 'ABC123',
        player: {
          id: 'player-1',
          username: 'Host',
          color: 'WHITE',
          disconnectedAt: disconnectAt,
        },
      })) as jest.MockedFunction<(payload: unknown) => Promise<unknown>>;

      const scheduleForfeit = jest.fn(async () => undefined) as jest.MockedFunction<
        (payload: unknown) => Promise<void>
      >;

      const gameService = { handleDisconnect, scheduleForfeit };

      const handler = disconnectHandler({
        io,
        socket,
        gameService: gameService as unknown,
      });

      await handler();

      expect(gameService.handleDisconnect).toHaveBeenCalledWith({
        playerId: 'player-1',
        socketId: 'socket-1',
      });

      expect(to).toHaveBeenCalledWith(`${GAME_ROOM_PREFIX}game-1`);
      expect(broadcastEmit).toHaveBeenCalledWith(
        WS_EVENTS.PLAYER_DISCONNECTED,
        expect.objectContaining({
          playerId: 'player-1',
          username: 'Host',
          color: 'WHITE',
          disconnectedAt: disconnectAt.toISOString(),
        })
      );

      expect(gameService.scheduleForfeit).toHaveBeenCalledWith({
        gameId: 'game-1',
        playerId: 'player-1',
        delayMs: 5 * 60 * 1000,
      });

      expect(socket.leave).toHaveBeenCalledWith(`${GAME_ROOM_PREFIX}game-1`);
    });

    it('não deve emitir eventos quando jogador não participa de partida ativa', async () => {
      const { io } = createMockIo();
      const socket = createMockSocket();
      const handleDisconnect = jest.fn(async () => null) as jest.MockedFunction<
        (payload: unknown) => Promise<unknown>
      >;

      const scheduleForfeit = jest.fn(async () => undefined) as jest.MockedFunction<
        (payload: unknown) => Promise<void>
      >;

      const gameService = { handleDisconnect, scheduleForfeit };

      const handler = disconnectHandler({
        io,
        socket,
        gameService: gameService as unknown,
      });

      await handler();

      expect(io.to).not.toHaveBeenCalled();
      expect(socket.emit).not.toHaveBeenCalled();
      expect(gameService.scheduleForfeit).not.toHaveBeenCalled();
    });
  });
});
