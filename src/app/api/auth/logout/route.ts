/**
 * T065: POST /api/auth/logout
 * Endpoint para encerrar sessão do usuário
 * 
 * Request: Cookie com session-token
 * Response: { success: true } | { error: string }
 * Status: 200 (sucesso), 401 (não autenticado), 500 (erro servidor)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PlayerService } from '@/services/PlayerService';

export async function POST(request: NextRequest) {
  try {
    // Obtém session token do cookie
    const sessionToken = request.cookies.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Remove sessão usando PlayerService
    const playerService = new PlayerService();
    await playerService.logout(sessionToken);

    // Cria response removendo cookie
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    // Remove cookie de sessão
    response.cookies.delete('session-token');

    return response;

  } catch (error) {
    // Erro genérico do servidor
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
