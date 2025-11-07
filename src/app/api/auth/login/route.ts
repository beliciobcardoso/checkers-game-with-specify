/**
 * T064: POST /api/auth/login
 * Endpoint para autenticação de usuário existente
 *
 * Request body: { email, password }
 * Response: { player: Player, sessionToken: string } | { error: string }
 * Status: 200 (sucesso), 400 (validação), 401 (credenciais inválidas), 500 (erro servidor)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PlayerService } from '@/services/PlayerService';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse e valida request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Autentica usando PlayerService
    const playerService = new PlayerService();
    const result = await playerService.login({ email, password });

    // Cria response com cookie de sessão
    const response = NextResponse.json(
      {
        player: result.player,
        sessionToken: result.sessionToken,
      },
      { status: 200 }
    );

    // Define cookie seguro com session token (7 dias)
    response.cookies.set('session-token', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 dias em segundos
      path: '/',
    });

    return response;
  } catch (error) {
    // Trata erro de credenciais inválidas
    if (
      error instanceof Error &&
      (error.message.includes('não encontrado') || error.message.includes('incorreta'))
    ) {
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
    }

    // Trata erro de validação
    if (error instanceof Error && error.message.includes('inválido')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Erro genérico do servidor
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
