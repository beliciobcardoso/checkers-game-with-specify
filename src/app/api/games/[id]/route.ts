/**
 * T096: GET /api/games/[id]
 *
 * Retrieves detailed information about a specific game.
 * Includes board state, player info, move history (optional), and game status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gameService } from '@/services/GameService';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params (Next.js 15 requirement)
    const { id: gameId } = await params;

    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeMoves = searchParams.get('includeMoves') === 'true';

    // Get game using GameService
    const game = await gameService.getGame(gameId, includeMoves);

    // Verify user is a player in this game
    if (game.whitePlayerId !== session.user.id && game.blackPlayerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para visualizar esta partida' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: game,
      },
      { status: 200 }
    );
  } catch (error) {
    const { id: gameId } = await params;
    logger.error('Failed to get game via API', { error, gameId });

    const statusCode =
      error instanceof Error && error.message.includes('não encontrada') ? 404 : 500;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao consultar partida',
      },
      { status: statusCode }
    );
  }
}
