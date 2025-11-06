/**
 * T062: PlayerService - Business logic layer for Player operations
 * Métodos: register, login, updateStatistics
 * Segurança: Bcrypt password hashing (work factor 12)
 */

import bcrypt from 'bcrypt';
import { z } from 'zod';
import { PlayerRepository } from '@/lib/db/repositories/player';
import { Player } from '@prisma/client';

// Schemas de validação Zod
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Username deve ter no mínimo 3 caracteres'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Types
export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  player: Omit<Player, 'passwordHash'>;
  sessionToken: string;
}

export class PlayerService {
  private playerRepository: PlayerRepository;
  private readonly BCRYPT_WORK_FACTOR = 12;
  private readonly SESSION_DURATION_DAYS = 7;

  constructor(playerRepository?: PlayerRepository) {
    this.playerRepository = playerRepository || new PlayerRepository();
  }

  /**
   * Hash de senha usando Bcrypt com work factor 12
   * @param password - Senha em texto plano
   * @returns Hash bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_WORK_FACTOR);
  }

  /**
   * Verifica senha contra hash
   * @param password - Senha em texto plano
   * @param hash - Hash bcrypt armazenado
   * @returns true se senha correta
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  /**
   * Registra novo jogador
   * @param data - Email, username, password
   * @returns Player criado e session token
   * @throws Se validação falhar ou email/username duplicado
   */
  async register(data: RegisterData): Promise<AuthResult> {
    // Validar input
    const validated = registerSchema.parse(data);

    // Hash da senha
    const passwordHash = await this.hashPassword(validated.password);

    // Criar jogador
    const player = await this.playerRepository.create({
      email: validated.email,
      username: validated.username,
      passwordHash,
    });

    // Criar sessão
    const sessionToken = await this.createSession(player.id);

    return {
      player,
      sessionToken,
    };
  }

  /**
   * Autentica jogador
   * @param data - Email e password
   * @returns Player e session token
   * @throws Se credenciais inválidas
   */
  async login(data: LoginData): Promise<AuthResult> {
    // Validar input
    const validated = loginSchema.parse(data);

    // Buscar jogador por email (com passwordHash)
    const player = await this.playerRepository.findByEmail(validated.email);

    if (!player) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await this.verifyPassword(
      validated.password,
      player.passwordHash!
    );

    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }

    // Atualizar lastLoginAt
    await this.playerRepository.updateLastLogin(player.id);

    // Criar sessão
    const sessionToken = await this.createSession(player.id);

    // Remover passwordHash antes de retornar
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...playerWithoutHash } = player;

    return {
      player: playerWithoutHash,
      sessionToken,
    };
  }

  /**
   * Atualiza estatísticas do jogador após partida
   * @param playerId - UUID do jogador
   * @param result - 'win' | 'loss' | 'draw'
   * @returns Player atualizado
   */
  async updateStatistics(
    playerId: string,
    result: 'win' | 'loss' | 'draw'
  ): Promise<Omit<Player, 'passwordHash'>> {
    return this.playerRepository.updateStats(playerId, result);
  }

  /**
   * Busca jogador por ID
   * @param id - UUID do jogador
   * @returns Player sem passwordHash
   * @throws Se jogador não encontrado
   */
  async findById(id: string): Promise<Omit<Player, 'passwordHash'>> {
    const player = await this.playerRepository.findById(id);

    if (!player) {
      throw new Error('Jogador não encontrado');
    }

    return player;
  }

  /**
   * Retorna estatísticas do jogador
   * @param id - UUID do jogador
   * @returns Estatísticas com winRate
   */
  async getStats(id: string) {
    return this.playerRepository.getStats(id);
  }

  /**
   * Retorna histórico de partidas
   * @param id - UUID do jogador
   * @param page - Página (1-indexed)
   * @param limit - Itens por página
   */
  async getHistory(id: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return this.playerRepository.getHistory(id, limit, offset);
  }

  /**
   * Cria sessão para jogador (usando Prisma Session model)
   * @param userId - UUID do jogador
   * @returns Session token
   */
  private async createSession(userId: string): Promise<string> {
    // Gerar token aleatório seguro
    const sessionToken = this.generateSecureToken();

    // Data de expiração (7 dias)
    const expires = new Date();
    expires.setDate(expires.getDate() + this.SESSION_DURATION_DAYS);

    // Criar sessão no banco via Prisma
    // Nota: Assumindo que Prisma Client está disponível
    const prisma = (
      await import('../lib/prisma')
    ).default;

    await prisma.session.create({
      data: {
        sessionToken,
        userId,
        expires,
      },
    });

    return sessionToken;
  }

  /**
   * Valida sessão
   * @param sessionToken - Token da sessão
   * @returns Player ID se sessão válida, null se inválida
   */
  async validateSession(sessionToken: string): Promise<string | null> {
    const prisma = (await import('../lib/prisma')).default;

    const session = await prisma.session.findUnique({
      where: { sessionToken },
    });

    if (!session) {
      return null;
    }

    // Verificar se sessão expirou
    if (session.expires < new Date()) {
      // Deletar sessão expirada
      await prisma.session.delete({
        where: { sessionToken },
      });
      return null;
    }

    return session.userId;
  }

  /**
   * Logout (deleta sessão)
   * @param sessionToken - Token da sessão
   */
  async logout(sessionToken: string): Promise<void> {
    const prisma = (await import('../lib/prisma')).default;

    await prisma.session.deleteMany({
      where: { sessionToken },
    });
  }

  /**
   * Gera token seguro para sessão
   * @returns String aleatória base64
   */
  private generateSecureToken(): string {
    // Gerar 32 bytes aleatórios
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    
    // Converter para base64
    return Buffer.from(randomBytes).toString('base64');
  }
}
