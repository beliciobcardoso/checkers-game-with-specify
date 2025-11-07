/**
 * T063: POST /api/auth/register
 * Endpoint para criação de nova conta
 *
 * Request body: { email, username, password }
 * Response: { player: Player, sessionToken: string } | { error: string }
 * Status: 201 (sucesso), 400 (validação), 409 (email duplicado), 500 (erro servidor)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PlayerService } from '@/services/PlayerService';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Username deve ter no mínimo 3 caracteres'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse e valida request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, username, password } = validationResult.data;

    // Cria player usando PlayerService
    const playerService = new PlayerService();
    const result = await playerService.register({ email, username, password });

    // Cria response com cookie de sessão
    const response = NextResponse.json(
      {
        player: result.player,
        sessionToken: result.sessionToken,
      },
      { status: 201 }
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
    // Trata erro de email duplicado
    if (error instanceof Error && error.message.includes('já está em uso')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    // Trata erro de validação do service
    if (error instanceof Error && error.message.includes('inválido')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Erro genérico do servidor
    console.error('Erro no registro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
