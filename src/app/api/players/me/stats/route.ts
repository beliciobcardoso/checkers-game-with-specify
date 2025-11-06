/**
 * T067: GET /api/players/me/stats
 * Endpoint para obter estatísticas do jogador autenticado
 * 
 * Request: Cookie com session-token
 * Response: { stats: { totalGames, wins, losses, draws, winRate } } | { error: string }
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
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Valida sessão
    const playerService = new PlayerService();
    const userId = await playerService.validateSession(sessionToken);

    if (!userId) {
      const response = NextResponse.json(
        { error: 'Sessão inválida ou expirada' },
        { status: 401 }
      );
      response.cookies.delete('session-token');
      return response;
    }

    // Busca estatísticas do player
    const playerRepository = new PlayerRepository();
    const stats = await playerRepository.getStats(userId);

    return NextResponse.json(
      { stats },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
