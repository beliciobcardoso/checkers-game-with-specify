/**
 * T098: POST /api/games/[id]/resign
 *
 * Allows a player to resign from an active game.
 * Automatically awards victory to the opponent.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gameService } from '@/services/GameService';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params (Next.js 15 requirement)
    const { id: gameId } = await params;

    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Resign from game using GameService
    const result = await gameService.resignGame(gameId, session.user.id);

    logger.info(`Player ${session.user.id} resigned from game ${gameId} via API`);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    const { id: gameId } = await params;
    logger.error('Failed to resign game via API', { error, gameId });

    // Differentiate validation errors from server errors
    const statusCode =
      error instanceof Error &&
      (error.message.includes('não está em andamento') ||
        error.message.includes('não está nesta partida'))
        ? 400
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao desistir da partida',
      },
      { status: statusCode }
    );
  }
}
