/**
 * T066: GET /api/players/me
 * Endpoint para obter dados do jogador autenticado
 * 
 * Request: Cookie com session-token
 * Response: { player: Player } | { error: string }
 * Status: 200 (sucesso), 401 (não autenticado/sessão inválida), 500 (erro servidor)
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

    // Valida sessão e obtém userId
    const playerService = new PlayerService();
    const userId = await playerService.validateSession(sessionToken);

    if (!userId) {
      // Sessão inválida ou expirada - remove cookie
      const response = NextResponse.json(
        { error: 'Sessão inválida ou expirada' },
        { status: 401 }
      );
      response.cookies.delete('session-token');
      return response;
    }

    // Busca dados do player (sem passwordHash)
    const playerRepository = new PlayerRepository();
    const player = await playerRepository.findById(userId);

    if (!player) {
      return NextResponse.json(
        { error: 'Player não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { player },
      { status: 200 }
    );

  } catch (error) {
    // Erro genérico do servidor
    console.error('Erro ao buscar dados do player:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
