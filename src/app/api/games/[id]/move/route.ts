/**
 * T097: POST /api/games/[id]/move
 *
 * Executes a move in an online game.
 * Validates turn, player authorization, and move legality.
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

    // Parse move data
    const body = await request.json();
    const { fromRow, fromCol, toRow, toCol } = body;

    // Validate move data
    if (
      typeof fromRow !== 'number' ||
      typeof fromCol !== 'number' ||
      typeof toRow !== 'number' ||
      typeof toCol !== 'number'
    ) {
      return NextResponse.json({ error: 'Dados de movimento inválidos' }, { status: 400 });
    }

    // Execute move using GameService
    const result = await gameService.makeMove(gameId, session.user.id, {
      fromRow,
      fromCol,
      toRow,
      toCol,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    const { id: gameId } = await params;
    logger.error('Failed to execute move via API', { error, gameId });

    // Differentiate validation errors from server errors
    const statusCode =
      error instanceof Error &&
      (error.message.includes('não é seu turno') ||
        error.message.includes('não está em andamento') ||
        error.message.includes('não está nesta partida'))
        ? 400
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao executar movimento',
      },
      { status: statusCode }
    );
  }
}
