/**
 * T057, T058: Testes de contrato para endpoints de perfil
 * GET /api/players/me - Retorna dados do jogador autenticado
 * GET /api/players/me/stats - Retorna estatísticas corretas
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Player Profile API Endpoints', () => {
  let sessionToken: string;
  let testPlayerId: string;

  beforeAll(async () => {
    // Limpar dados de teste
    await prisma.player.deleteMany({
      where: { email: { contains: 'test-profile' } },
    });

    // Criar usuário e fazer login
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-profile@example.com',
        username: 'ProfileTestUser',
        password: 'TestPass123!',
      }),
    });

    const { id } = await registerResponse.json();
    testPlayerId = id;

    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test-profile@example.com',
        password: 'TestPass123!',
      }),
    });

    const loginData = await loginResponse.json();
    sessionToken = loginData.sessionToken;
  });

  afterAll(async () => {
    await prisma.player.deleteMany({
      where: { email: { contains: 'test-profile' } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/players/me', () => {
    it('should return authenticated player data', async () => {
      const response = await fetch('http://localhost:3000/api/players/me', {
        headers: {
          Cookie: `session-token=${sessionToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(testPlayerId);
      expect(data.email).toBe('test-profile@example.com');
      expect(data.username).toBe('ProfileTestUser');
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('lastLoginAt');

      // Não deve expor dados sensíveis
      expect(data).not.toHaveProperty('passwordHash');
    });

    it('should reject unauthenticated request', async () => {
      const response = await fetch('http://localhost:3000/api/players/me');

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Não autenticado');
    });

    it('should reject invalid session token', async () => {
      const response = await fetch('http://localhost:3000/api/players/me', {
        headers: {
          Cookie: 'session-token=invalid-token-123',
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Sessão inválida');
    });
  });

  describe('GET /api/players/me/stats', () => {
    beforeAll(async () => {
      // Simular estatísticas do jogador
      await prisma.player.update({
        where: { id: testPlayerId },
        data: {
          totalGames: 10,
          wins: 6,
          losses: 3,
          draws: 1,
        },
      });
    });

    it('should return correct player statistics', async () => {
      const response = await fetch('http://localhost:3000/api/players/me/stats', {
        headers: {
          Cookie: `session-token=${sessionToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.totalGames).toBe(10);
      expect(data.wins).toBe(6);
      expect(data.losses).toBe(3);
      expect(data.draws).toBe(1);

      // Deve calcular taxa de vitória
      expect(data.winRate).toBeCloseTo(0.6, 2); // 6/10 = 60%
    });

    it('should return zero stats for new player', async () => {
      // Criar novo jogador sem partidas
      await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-profile-newplayer@example.com',
          username: 'NewPlayer',
          password: 'TestPass123!',
        }),
      });

      const newPlayerLogin = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-profile-newplayer@example.com',
          password: 'TestPass123!',
        }),
      });

      const { sessionToken: newToken } = await newPlayerLogin.json();

      const response = await fetch('http://localhost:3000/api/players/me/stats', {
        headers: {
          Cookie: `session-token=${newToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.totalGames).toBe(0);
      expect(data.wins).toBe(0);
      expect(data.losses).toBe(0);
      expect(data.draws).toBe(0);
      expect(data.winRate).toBe(0);
    });

    it('should reject unauthenticated request', async () => {
      const response = await fetch('http://localhost:3000/api/players/me/stats');

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Não autenticado');
    });
  });

  describe('GET /api/players/me/history', () => {
    beforeAll(async () => {
      // Criar partidas de exemplo para histórico
      const whitePlayerResponse = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-profile-opponent@example.com',
          username: 'OpponentPlayer',
          password: 'TestPass123!',
        }),
      });

      const { id: opponentId } = await whitePlayerResponse.json();

      // Criar 3 partidas de teste
      await prisma.game.createMany({
        data: [
          {
            type: 'ONLINE',
            status: 'FINISHED',
            result: 'WHITE_WIN',
            whitePlayerId: testPlayerId,
            blackPlayerId: opponentId,
            boardState: { pieces: [] },
            currentTurn: 'WHITE',
            moveCount: 25,
          },
          {
            type: 'ONLINE',
            status: 'FINISHED',
            result: 'BLACK_WIN',
            whitePlayerId: opponentId,
            blackPlayerId: testPlayerId,
            boardState: { pieces: [] },
            currentTurn: 'BLACK',
            moveCount: 30,
          },
          {
            type: 'BOT',
            status: 'FINISHED',
            result: 'DRAW',
            whitePlayerId: testPlayerId,
            botDifficulty: 'MEDIUM',
            boardState: { pieces: [] },
            currentTurn: 'WHITE',
            moveCount: 40,
          },
        ],
      });
    });

    it('should return game history for authenticated player', async () => {
      const response = await fetch('http://localhost:3000/api/players/me/history', {
        headers: {
          Cookie: `session-token=${sessionToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.games).toHaveLength(3);
      expect(data.total).toBe(3);

      // Verificar estrutura dos jogos
      const game = data.games[0];
      expect(game).toHaveProperty('id');
      expect(game).toHaveProperty('type');
      expect(game).toHaveProperty('result');
      expect(game).toHaveProperty('createdAt');
      expect(game).toHaveProperty('opponent'); // ou 'botDifficulty' se for bot
    });

    it('should support pagination', async () => {
      const response = await fetch('http://localhost:3000/api/players/me/history?page=1&limit=2', {
        headers: {
          Cookie: `session-token=${sessionToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.games).toHaveLength(2); // Limite de 2
      expect(data.total).toBe(3); // Total ainda é 3
      expect(data.page).toBe(1);
      expect(data.limit).toBe(2);
    });

    it('should order games by most recent first', async () => {
      const response = await fetch('http://localhost:3000/api/players/me/history', {
        headers: {
          Cookie: `session-token=${sessionToken}`,
        },
      });

      const data = await response.json();
      const games = data.games;

      // Verificar ordem decrescente por createdAt
      for (let i = 0; i < games.length - 1; i++) {
        const current = new Date(games[i].createdAt);
        const next = new Date(games[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it('should reject unauthenticated request', async () => {
      const response = await fetch('http://localhost:3000/api/players/me/history');

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Não autenticado');
    });
  });
});
