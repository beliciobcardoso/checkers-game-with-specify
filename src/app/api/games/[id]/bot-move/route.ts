/**
 * T136: POST /api/games/[id]/bot-move
 *
 * Triggers the bot to make a move in a bot game.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { botService } from '@/services/BotService';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { GameType, Game, GameStatus, GameResult, Color } from '@/types/game';
import { deserializeBoardState } from '@/lib/utils/boardState';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { id: gameId } = await params;

    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Get game from database
    const gameData = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!gameData) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    // Convert to Game type
    const game: Game = {
      ...gameData,
      boardState: deserializeBoardState(gameData.boardState),
      type: gameData.type as GameType,
      status: gameData.status as GameStatus,
      result: gameData.result as GameResult | null,
      currentTurn: gameData.currentTurn as Color,
    };

    // Validate this is a bot game
    if (game.type !== GameType.BOT) {
      return NextResponse.json({ error: 'Este não é um jogo contra bot' }, { status: 400 });
    }

    // Validate player is part of the game
    if (game.whitePlayerId !== session.user.id && game.blackPlayerId !== session.user.id) {
      return NextResponse.json({ error: 'Você não faz parte deste jogo' }, { status: 403 });
    }

    // Check if it's bot's turn
    if (!botService.isBotTurn(game)) {
      return NextResponse.json({ error: 'Não é turno do bot' }, { status: 400 });
    }

    // Execute bot move
    const updatedGame = await botService.executeBotMove(game);

    logger.info(`Bot move executed in game ${gameId}`);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedGame.id,
        type: updatedGame.type,
        status: updatedGame.status,
        whitePlayerId: updatedGame.whitePlayerId,
        blackPlayerId: updatedGame.blackPlayerId,
        currentTurn: updatedGame.currentTurn,
        boardState: updatedGame.boardState,
        moveCount: updatedGame.moveCount,
        botDifficulty: updatedGame.botDifficulty,
      },
    });
  } catch (error) {
    // Await params again in catch block
    const { id: gameId } = await params;
    logger.error('Failed to execute bot move', { error, gameId });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erro ao executar movimento do bot',
      },
      { status: 500 }
    );
  }
}
