/**
 * T081: Teste de contrato para POST /api/games
 *
 * Garante que a criação de partidas ONLINE via API respeita autenticação,
 * validação de payload (roomCode obrigatório) e vinculação correta aos jogadores
 * associados à sala. Também cobre erros esperados (401, 400, 404).
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
import type { BoardState, Piece } from '@/types/game';

const prisma = new PrismaClient();

const createdRoomIds: string[] = [];
const createdGameIds: string[] = [];
const createdPlayerEmails = new Set<string>();

describe('Games API Endpoints', () => {
  const hostCredentials: PlayerCredentials = {
    email: generateTestEmail('games-host'),
    username: generateTestUsername('GamesHost'),
    password: 'GamesHostPass123!',
  };

  const joinerCredentials: PlayerCredentials = {
    email: generateTestEmail('games-joiner'),
    username: generateTestUsername('GamesJoin'),
    password: 'GamesJoinerPass123!',
  };

  let hostSessionToken: string;
  let hostPlayerId: string;
  let joinerSessionToken: string;
  let joinerPlayerId: string;

  beforeAll(async () => {
    createdPlayerEmails.add(hostCredentials.email);
    createdPlayerEmails.add(joinerCredentials.email);

    const hostSession = await createPlayerSession(hostCredentials);
    hostPlayerId = hostSession.playerId;
    hostSessionToken = hostSession.sessionToken;

    const joinerSession = await createPlayerSession(joinerCredentials);
    joinerPlayerId = joinerSession.playerId;
    joinerSessionToken = joinerSession.sessionToken;
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

  describe('POST /api/games', () => {
    it('deve criar partida online usando roomCode válido', async () => {
      const roomData = await createRoom(hostSessionToken);
      createdRoomIds.push(roomData.roomId);
      createdGameIds.push(roomData.gameId);

      const joinResponse = await fetch(
        `${API_BASE_URL}/rooms/${roomData.code}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session-token=${joinerSessionToken}`,
          },
        }
      );

      expect(joinResponse.status).toBe(200);
      await joinResponse.json();

      const response = await fetch(`${API_BASE_URL}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session-token=${hostSessionToken}`,
        },
        body: JSON.stringify({ type: 'ONLINE', roomCode: roomData.code }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data.id).toBe(roomData.gameId);
      expect(data.type).toBe('ONLINE');
      expect(data.status).toBe('IN_PROGRESS');
      expect(data.whitePlayerId).toBe(hostPlayerId);
      expect(data.blackPlayerId).toBe(joinerPlayerId);
      expect(Array.isArray(data.boardState?.pieces)).toBe(true);
      expect(data.boardState?.pieces).toHaveLength(24);
      expect(data.currentTurn).toBe('WHITE');

      const persistedGame = await prisma.game.findUnique({
        where: { id: data.id },
      });

      expect(persistedGame).not.toBeNull();
      expect(persistedGame?.status).toBe('IN_PROGRESS');
      expect(persistedGame?.whitePlayerId).toBe(hostPlayerId);
      expect(persistedGame?.blackPlayerId).toBe(joinerPlayerId);
    });

    it('deve rejeitar requisições sem autenticação', async () => {
      const roomData = await createRoom(hostSessionToken);
      createdRoomIds.push(roomData.roomId);
      createdGameIds.push(roomData.gameId);

      const response = await fetch(`${API_BASE_URL}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ONLINE', roomCode: roomData.code }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Não autenticado');
    });

    it('deve exigir roomCode para partidas online', async () => {
      const response = await fetch(`${API_BASE_URL}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session-token=${hostSessionToken}`,
        },
        body: JSON.stringify({ type: 'ONLINE' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Código');
    });

    it('deve retornar 404 quando roomCode não existir', async () => {
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

      const response = await fetch(`${API_BASE_URL}/games`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session-token=${hostSessionToken}`,
        },
        body: JSON.stringify({ type: 'ONLINE', roomCode: invalidCode }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Sala não encontrada');
    });
  });

  describe('POST /api/games/:id/move', () => {
    async function setupOnlineGame() {
      const roomData = await createRoom(hostSessionToken);
      createdRoomIds.push(roomData.roomId);
      createdGameIds.push(roomData.gameId);

      const joinResponse = await fetch(
        `${API_BASE_URL}/rooms/${roomData.code}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `session-token=${joinerSessionToken}`,
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
        body: JSON.stringify({ type: 'ONLINE', roomCode: roomData.code }),
      });

      expect(createGameResponse.status).toBe(201);
      const createdGame = await createGameResponse.json();

      return {
        room: roomData,
        game: createdGame,
      };
    }

    function getInitialWhitePiece(boardState: BoardState): Piece {
      const targetPiece = boardState?.pieces?.find(
        (piece: Piece) => piece.color === 'WHITE' && piece.row === 5 && piece.col === 0
      );

      if (!targetPiece) {
        throw new Error('Não foi possível localizar peça branca inicial esperada para o teste');
      }

      return targetPiece;
    }

    function getInitialBlackPiece(boardState: BoardState): Piece {
      const targetPiece = boardState?.pieces?.find(
        (piece: Piece) => piece.color === 'BLACK' && piece.row === 2 && piece.col === 1
      );

      if (!targetPiece) {
        throw new Error('Não foi possível localizar peça preta inicial esperada para o teste');
      }

      return targetPiece;
    }

    it('deve executar movimento válido e atualizar estado do jogo', async () => {
      const { game } = await setupOnlineGame();

      const persistedGame = await prisma.game.findUnique({
        where: { id: game.id },
      });

      expect(persistedGame).not.toBeNull();

  const boardState = persistedGame?.boardState as unknown as BoardState;
      const movingPiece = getInitialWhitePiece(boardState);

      const moveResponse = await fetch(`${API_BASE_URL}/games/${game.id}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session-token=${hostSessionToken}`,
        },
        body: JSON.stringify({
          pieceId: movingPiece.id,
          toRow: movingPiece.row - 1,
          toCol: movingPiece.col + 1,
        }),
      });

      expect(moveResponse.status).toBe(200);
      const data = await moveResponse.json();

      expect(data.move).toBeDefined();
      expect(data.move.pieceId).toBe(movingPiece.id);
      expect(data.move.fromRow).toBe(movingPiece.row);
      expect(data.move.fromCol).toBe(movingPiece.col);
      expect(data.move.toRow).toBe(movingPiece.row - 1);
      expect(data.move.toCol).toBe(movingPiece.col + 1);
      expect(data.move.sequenceNumber).toBe(1);
      expect(data.move.capturedPieces).toEqual([]);
      expect(data.move.wasPromotion).toBe(false);

      expect(data.game).toBeDefined();
      expect(data.game.id).toBe(game.id);
      expect(data.game.currentTurn).toBe('BLACK');
      expect(data.game.status).toBe('IN_PROGRESS');
      expect(data.game.moveCount).toBe(1);

  const updatedBoardState = data.game.boardState as unknown as BoardState;
      const updatedPieces = updatedBoardState?.pieces ?? [];
      const movedPiece = updatedPieces.find((piece: Piece) => piece.id === movingPiece.id);
      expect(movedPiece?.row).toBe(movingPiece.row - 1);
      expect(movedPiece?.col).toBe(movingPiece.col + 1);

      const originStillOccupied = updatedPieces.find(
        (piece: Piece) => piece.row === movingPiece.row && piece.col === movingPiece.col
      );
      expect(originStillOccupied).toBeUndefined();

      const persistedMove = await prisma.move.findFirst({
        where: { gameId: game.id, sequenceNumber: 1 },
      });

      expect(persistedMove).not.toBeNull();
      expect(persistedMove?.pieceId).toBe(movingPiece.id);
      expect(persistedMove?.fromRow).toBe(movingPiece.row);
      expect(persistedMove?.fromCol).toBe(movingPiece.col);
      expect(persistedMove?.toRow).toBe(movingPiece.row - 1);
      expect(persistedMove?.toCol).toBe(movingPiece.col + 1);

      const refreshedGame = await prisma.game.findUnique({ where: { id: game.id } });
      expect(refreshedGame?.currentTurn).toBe('BLACK');
      expect(refreshedGame?.moveCount).toBe(1);
      expect(refreshedGame?.lastMoveAt).not.toBeNull();
    });

    it('deve rejeitar requisições sem autenticação', async () => {
      const { game } = await setupOnlineGame();

      const moveResponse = await fetch(`${API_BASE_URL}/games/${game.id}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pieceId: 'w1', toRow: 4, toCol: 1 }),
      });

      expect(moveResponse.status).toBe(401);
      const data = await moveResponse.json();
      expect(data.error).toContain('Não autenticado');
    });

    it('deve validar payload obrigatório', async () => {
      const { game } = await setupOnlineGame();

      const response = await fetch(`${API_BASE_URL}/games/${game.id}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session-token=${hostSessionToken}`,
        },
        body: JSON.stringify({ pieceId: 'w1', toRow: 4 }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('válido');
    });

    it('deve impedir movimento fora da vez do jogador', async () => {
      const { game } = await setupOnlineGame();

      const persistedGame = await prisma.game.findUnique({
        where: { id: game.id },
      });

  const boardState = persistedGame?.boardState as unknown as BoardState;
      const blackPiece = getInitialBlackPiece(boardState);

      const response = await fetch(`${API_BASE_URL}/games/${game.id}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session-token=${joinerSessionToken}`,
        },
        body: JSON.stringify({
          pieceId: blackPiece.id,
          toRow: blackPiece.row + 1,
          toCol: blackPiece.col - 1,
        }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Não é sua vez');
    });

    it('deve retornar movimentos válidos quando movimento for inválido', async () => {
      const { game } = await setupOnlineGame();

      const persistedGame = await prisma.game.findUnique({
        where: { id: game.id },
      });

  const boardState = persistedGame?.boardState as unknown as BoardState;
      const movingPiece = getInitialWhitePiece(boardState);

      const response = await fetch(`${API_BASE_URL}/games/${game.id}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `session-token=${hostSessionToken}`,
        },
        body: JSON.stringify({
          pieceId: movingPiece.id,
          toRow: movingPiece.row,
          toCol: movingPiece.col,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Movimento inválido');
      expect(Array.isArray(data.validMoves)).toBe(true);
      expect(data.validMoves?.length).toBeGreaterThan(0);
    });
  });
});
