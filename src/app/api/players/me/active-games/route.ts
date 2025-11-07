/**
 * T117: GET /api/players/me/active-games
 *
 * Returns player's active online games (IN_PROGRESS status).
 * Used for game resumption after reconnection.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gameService } from '@/services/GameService';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Get active games for player
    const games = await gameService.listPlayerGames(session.user.id, 'IN_PROGRESS');

    logger.info('Active games retrieved', {
      playerId: session.user.id,
      count: games.length,
    });

    return NextResponse.json({ games });
  } catch (error) {
    logger.error('Failed to get active games', { error });

    return NextResponse.json({ error: 'Erro ao buscar partidas ativas' }, { status: 500 });
  }
}
