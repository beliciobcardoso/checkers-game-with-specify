/**
 * T092: POST /api/rooms/[code]/join
 *
 * Allows a player to join an existing room by code.
 * Assigns the joining player as the black player and starts the game.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { roomService } from '@/services/RoomService';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { code: roomCode } = await params;

    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Validate code format (6 alphanumeric chars)
    if (!roomCode || !/^[A-Z0-9]{6}$/i.test(roomCode)) {
      return NextResponse.json({ error: 'Código de sala inválido' }, { status: 400 });
    }

    // Join room using RoomService
    const room = await roomService.joinRoom(roomCode.toUpperCase(), session.user.id);

    logger.info(`Player ${session.user.id} joined room ${roomCode} via API`);

    return NextResponse.json(
      {
        success: true,
        data: {
          code: room.code,
          status: room.status,
          gameId: room.gameId,
          whitePlayerId: room.whitePlayerId,
          blackPlayerId: room.blackPlayerId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const { code: roomCode } = await params;
    logger.error('Failed to join room via API', { error, code: roomCode });

    // Differentiate between validation errors and server errors
    const statusCode =
      error instanceof Error &&
      (error.message.includes('não disponível') ||
        error.message.includes('não encontrada') ||
        error.message.includes('já está na sala'))
        ? 400
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao entrar na sala',
      },
      { status: statusCode }
    );
  }
}
