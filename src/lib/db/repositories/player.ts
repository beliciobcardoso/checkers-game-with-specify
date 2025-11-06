/**
 * T061: PlayerRepository - Data access layer for Player entity
 * Métodos: create, findByEmail, findById, updateStats
 */

import { PrismaClient, Player, Prisma } from '@prisma/client';
import prisma from '../../prisma';

export class PlayerRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Cria novo jogador no banco de dados
   * @param data - Dados do jogador (email, username, passwordHash)
   * @returns Player criado
   * @throws Se email ou username já existe
   */
  async create(
    data: Prisma.PlayerCreateInput
  ): Promise<Omit<Player, 'passwordHash'>> {
    try {
      const player = await this.prisma.player.create({
        data: {
          email: data.email,
          username: data.username,
          passwordHash: data.passwordHash,
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
        },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          totalGames: true,
          wins: true,
          losses: true,
          draws: true,
        },
      });

      return player;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          const field = (error.meta?.target as string[])?.[0];
          throw new Error(
            field === 'email'
              ? 'Email já cadastrado'
              : 'Username já em uso'
          );
        }
      }
      throw error;
    }
  }

  /**
   * Busca jogador por email (para autenticação)
   * @param email - Email do jogador
   * @returns Player com passwordHash ou null se não encontrado
   */
  async findByEmail(email: string): Promise<Player | null> {
    return this.prisma.player.findUnique({
      where: { email },
    });
  }

  /**
   * Busca jogador por ID
   * @param id - UUID do jogador
   * @returns Player sem passwordHash ou null se não encontrado
   */
  async findById(id: string): Promise<Omit<Player, 'passwordHash'> | null> {
    return this.prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        totalGames: true,
        wins: true,
        losses: true,
        draws: true,
      },
    });
  }

  /**
   * Busca jogador por username
   * @param username - Username do jogador
   * @returns Player sem passwordHash ou null se não encontrado
   */
  async findByUsername(
    username: string
  ): Promise<Omit<Player, 'passwordHash'> | null> {
    return this.prisma.player.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        totalGames: true,
        wins: true,
        losses: true,
        draws: true,
      },
    });
  }

  /**
   * Atualiza estatísticas do jogador após partida
   * @param id - UUID do jogador
   * @param result - Resultado da partida ('win' | 'loss' | 'draw')
   * @returns Player atualizado
   */
  async updateStats(
    id: string,
    result: 'win' | 'loss' | 'draw'
  ): Promise<Omit<Player, 'passwordHash'>> {
    const updateData: Prisma.PlayerUpdateInput = {
      totalGames: { increment: 1 },
      updatedAt: new Date(),
    };

    if (result === 'win') {
      updateData.wins = { increment: 1 };
    } else if (result === 'loss') {
      updateData.losses = { increment: 1 };
    } else {
      updateData.draws = { increment: 1 };
    }

    return this.prisma.player.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        totalGames: true,
        wins: true,
        losses: true,
        draws: true,
      },
    });
  }

  /**
   * Atualiza timestamp de último login
   * @param id - UUID do jogador
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.player.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Retorna estatísticas do jogador
   * @param id - UUID do jogador
   * @returns Estatísticas com winRate calculado
   */
  async getStats(id: string): Promise<{
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  }> {
    const player = await this.prisma.player.findUnique({
      where: { id },
      select: {
        totalGames: true,
        wins: true,
        losses: true,
        draws: true,
      },
    });

    if (!player) {
      throw new Error('Jogador não encontrado');
    }

    const winRate =
      player.totalGames > 0 ? player.wins / player.totalGames : 0;

    return {
      ...player,
      winRate,
    };
  }

  /**
   * Retorna histórico de partidas do jogador
   * @param id - UUID do jogador
   * @param limit - Número de partidas (padrão 20)
   * @param offset - Offset para paginação (padrão 0)
   * @returns Lista de partidas com oponente
   */
  async getHistory(id: string, limit = 20, offset = 0) {
    const games = await this.prisma.game.findMany({
      where: {
        OR: [{ whitePlayerId: id }, { blackPlayerId: id }],
        status: 'FINISHED',
      },
      include: {
        whitePlayer: {
          select: { id: true, username: true },
        },
        blackPlayer: {
          select: { id: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.game.count({
      where: {
        OR: [{ whitePlayerId: id }, { blackPlayerId: id }],
        status: 'FINISHED',
      },
    });

    return {
      games: games.map((game) => ({
        id: game.id,
        type: game.type,
        result: game.result,
        createdAt: game.createdAt,
        moveCount: game.moveCount,
        opponent:
          game.type === 'BOT'
            ? { botDifficulty: game.botDifficulty }
            : game.whitePlayerId === id
              ? game.blackPlayer
              : game.whitePlayer,
        playerColor: game.whitePlayerId === id ? 'WHITE' : 'BLACK',
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Deleta jogador por ID (admin only, soft delete futuro)
   * @param id - UUID do jogador
   */
  async delete(id: string): Promise<void> {
    await this.prisma.player.delete({
      where: { id },
    });
  }
}
