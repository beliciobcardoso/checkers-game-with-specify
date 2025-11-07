/**
 * T094: POST /api/games
 * T095: GET /api/games
 * T135: POST /api/games - Support for bot games
 *
 * POST: Creates a new online game or bot game.
 * GET: Lists all games for the authenticated player.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gameService } from '@/services/GameService';
import { botService } from '@/services/BotService';
import { logger } from '@/lib/logger';
import { GameStatus } from '@prisma/client';
import { Color } from '@/types/game';
import { BotDifficulty, isValidDifficulty } from '@/lib/game/bot/factory';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { whitePlayerId, blackPlayerId, type, botDifficulty, playerColor } = body;

    // Check if this is a bot game
    if (type === 'BOT' || botDifficulty) {
      // Validate bot difficulty
      if (!botDifficulty || !isValidDifficulty(botDifficulty)) {
        return NextResponse.json(
          { error: 'Dificuldade do bot inválida. Use EASY, MEDIUM ou HARD.' },
          { status: 400 }
        );
      }

      // Validate player color if provided
      const playerColorEnum = playerColor === 'BLACK' ? Color.BLACK : Color.WHITE;

      // Create bot game
      const game = await botService.startBotGame(
        session.user.id,
        botDifficulty as BotDifficulty,
        playerColorEnum
      );

      logger.info(
        `Bot game created: ${game.id} by user ${session.user.id} with difficulty ${botDifficulty}`
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            id: game.id,
            type: game.type,
            status: game.status,
            whitePlayerId: game.whitePlayerId,
            blackPlayerId: game.blackPlayerId,
            currentTurn: game.currentTurn,
            boardState: game.boardState,
            botDifficulty: game.botDifficulty,
          },
        },
        { status: 201 }
      );
    }

    // Regular online game
    // Validate at least creator is one of the players
    if (whitePlayerId !== session.user.id && blackPlayerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Você deve ser um dos jogadores da partida' },
        { status: 400 }
      );
    }

    // Create game using GameService
    const game = await gameService.createGame(whitePlayerId || session.user.id, blackPlayerId);

    logger.info(`Game created via API: ${game.id} by user ${session.user.id}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: game.id,
          type: game.type,
          status: game.status,
          whitePlayerId: game.whitePlayerId,
          blackPlayerId: game.blackPlayerId,
          currentTurn: game.currentTurn,
          boardState: game.boardState,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create game via API', { error });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar partida',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const statusFilter = statusParam ? (statusParam as GameStatus) : undefined;

    // List games using GameService
    const games = await gameService.listPlayerGames(session.user.id, statusFilter);

    return NextResponse.json(
      {
        success: true,
        data: games,
        count: games.length,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Failed to list games via API', { error });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar partidas',
      },
      { status: 500 }
    );
  }
}
