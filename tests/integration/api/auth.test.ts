/**
 * T055, T056: Testes de contrato para endpoints de autenticação
 * POST /api/auth/register - Validação email único, senha mínima 8 chars
 * POST /api/auth/login - Credenciais válidas/inválidas
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Authentication API Endpoints', () => {
  beforeAll(async () => {
    // Limpar dados de teste
    await prisma.player.deleteMany({
      where: { email: { contains: 'test-auth' } },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.player.deleteMany({
      where: { email: { contains: 'test-auth' } },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should create account with valid email and password', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-auth-1@example.com',
          username: 'TestUser1',
          password: 'ValidPass123!',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.email).toBe('test-auth-1@example.com');
      expect(data.username).toBe('TestUser1');
      expect(data).not.toHaveProperty('passwordHash'); // Não deve expor hash
    });

    it('should reject duplicate email', async () => {
      // Primeiro registro
      await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-auth-2@example.com',
          username: 'TestUser2',
          password: 'ValidPass123!',
        }),
      });

      // Tentativa de duplicação
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-auth-2@example.com',
          username: 'TestUser2Different',
          password: 'ValidPass123!',
        }),
      });

      expect(response.status).toBe(409); // Conflict
      const data = await response.json();
      expect(data.error).toContain('Email já cadastrado');
    });

    it('should reject password shorter than 8 characters', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-auth-3@example.com',
          username: 'TestUser3',
          password: 'Short1!',
        }),
      });

      expect(response.status).toBe(400); // Bad Request
      const data = await response.json();
      expect(data.error).toContain('Senha deve ter no mínimo 8 caracteres');
    });

    it('should reject invalid email format', async () => {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          username: 'TestUser4',
          password: 'ValidPass123!',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Email inválido');
    });

    it('should reject duplicate username', async () => {
      // Primeiro registro
      await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-auth-5@example.com',
          username: 'UniqueUsername',
          password: 'ValidPass123!',
        }),
      });

      // Tentativa de duplicação de username
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-auth-6@example.com',
          username: 'UniqueUsername',
          password: 'ValidPass123!',
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('Username já em uso');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Criar usuário para testes de login
      await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-auth-login@example.com',
          username: 'LoginTestUser',
          password: 'CorrectPassword123!',
        }),
      });
    });

    it('should login with valid credentials', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-auth-login@example.com',
          password: 'CorrectPassword123!',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('sessionToken');
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe('test-auth-login@example.com');
      
      // Deve definir cookie de sessão
      const setCookie = response.headers.get('set-cookie');
      expect(setCookie).toContain('session-token');
    });

    it('should reject invalid password', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-auth-login@example.com',
          password: 'WrongPassword123!',
        }),
      });

      expect(response.status).toBe(401); // Unauthorized
      const data = await response.json();
      expect(data.error).toContain('Credenciais inválidas');
    });

    it('should reject non-existent email', async () => {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Credenciais inválidas');
    });

    it('should update lastLoginAt timestamp on successful login', async () => {
      const beforeLogin = new Date();
      
      await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test-auth-login@example.com',
          password: 'CorrectPassword123!',
        }),
      });

      // Verificar no banco
      const player = await prisma.player.findUnique({
        where: { email: 'test-auth-login@example.com' },
      });

      expect(player?.lastLoginAt).toBeDefined();
      expect(player?.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(
        beforeLogin.getTime()
      );
    });
  });
});
