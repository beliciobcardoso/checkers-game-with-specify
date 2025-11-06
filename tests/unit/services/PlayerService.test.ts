/**
 * T059: Teste unitário para hash de senha
 * Bcrypt, verificação, work factor 12
 */

import { describe, it, expect } from '@jest/globals';
import bcrypt from 'bcrypt';
import { PlayerService } from '@/services/PlayerService';

describe('PlayerService - Password Hashing', () => {
  describe('hashPassword', () => {
    it('should hash password with bcrypt work factor 12', async () => {
      const playerService = new PlayerService();
      const password = 'TestPassword123!';

      const hash = await playerService.hashPassword(password);

      // Verificar formato bcrypt
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
      
      // Verificar work factor (rounds) = 12
      const rounds = bcrypt.getRounds(hash);
      expect(rounds).toBe(12);

      // Hash não deve ser igual à senha original
      expect(hash).not.toBe(password);
    });

    it('should generate different hashes for same password', async () => {
      const playerService = new PlayerService();
      const password = 'TestPassword123!';

      const hash1 = await playerService.hashPassword(password);
      const hash2 = await playerService.hashPassword(password);

      // Hashes devem ser diferentes (salt diferente)
      expect(hash1).not.toBe(hash2);

      // Mas ambos devem ser válidos para verificação
      const isValid1 = await bcrypt.compare(password, hash1);
      const isValid2 = await bcrypt.compare(password, hash2);
      expect(isValid1).toBe(true);
      expect(isValid2).toBe(true);
    });

    it('should handle special characters in password', async () => {
      const playerService = new PlayerService();
      const password = 'C0mpl3x!@#$%^&*()_+-=[]{}|;:,.<>?';

      const hash = await playerService.hashPassword(password);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should handle long passwords', async () => {
      const playerService = new PlayerService();
      // Bcrypt limita senha a 72 bytes
      const password = 'A'.repeat(100);

      const hash = await playerService.hashPassword(password);

      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const playerService = new PlayerService();
      const password = 'CorrectPassword123!';
      const hash = await playerService.hashPassword(password);

      const isValid = await playerService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const playerService = new PlayerService();
      const password = 'CorrectPassword123!';
      const hash = await playerService.hashPassword(password);

      const isValid = await playerService.verifyPassword('WrongPassword123!', hash);

      expect(isValid).toBe(false);
    });

    it('should reject case-different password', async () => {
      const playerService = new PlayerService();
      const password = 'TestPassword123!';
      const hash = await playerService.hashPassword(password);

      // Senha é case-sensitive
      const isValid = await playerService.verifyPassword('testpassword123!', hash);

      expect(isValid).toBe(false);
    });

    it('should handle invalid hash gracefully', async () => {
      const playerService = new PlayerService();

      const isValid = await playerService.verifyPassword(
        'SomePassword123!',
        'invalid-hash'
      );

      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const playerService = new PlayerService();
      const hash = await playerService.hashPassword('ValidPassword123!');

      const isValid = await playerService.verifyPassword('', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('Password Security', () => {
    it('should take reasonable time to hash (not instant)', async () => {
      const playerService = new PlayerService();
      const password = 'TestPassword123!';

      const startTime = Date.now();
      await playerService.hashPassword(password);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Work factor 12 deve levar > 10ms (previne brute force rápido)
      expect(duration).toBeGreaterThan(10);
      
      // Mas não deve ser excessivamente lento (< 500ms)
      expect(duration).toBeLessThan(500);
    });

    it('should take reasonable time to verify', async () => {
      const playerService = new PlayerService();
      const password = 'TestPassword123!';
      const hash = await playerService.hashPassword(password);

      const startTime = Date.now();
      await playerService.verifyPassword(password, hash);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Verificação deve ser rápida (< 200ms)
      expect(duration).toBeLessThan(200);
    });
  });
});
