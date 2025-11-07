/**
 * T068: GET /api/players/me/history
 * Endpoint para obter histórico de partidas do jogador autenticado
 *
 * Query params: ?page=1&limit=20
 * Request: Cookie com session-token
 * Response: { games: Game[], total: number, page: number, limit: number } | { error: string }
 * Status: 200 (sucesso), 401 (não autenticado), 500 (erro servidor)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PlayerService } from '@/services/PlayerService';
import { PlayerRepository } from '@/lib/db/repositories/player';

export async function GET(request: NextRequest) {
  try {
    // Obtém session token do cookie
    const sessionToken = request.cookies.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Valida sessão
    const playerService = new PlayerService();
    const userId = await playerService.validateSession(sessionToken);

    if (!userId) {
      const response = NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
      response.cookies.delete('session-token');
      return response;
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Valida params
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos (page >= 1, 1 <= limit <= 100)' },
        { status: 400 }
      );
    }

    // Busca histórico de partidas
    const playerRepository = new PlayerRepository();
    const offset = (page - 1) * limit;
    const result = await playerRepository.getHistory(userId, limit, offset);

    return NextResponse.json(
      {
        games: result.games,
        total: result.total,
        page,
        limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
