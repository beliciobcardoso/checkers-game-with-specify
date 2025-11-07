/**
 * T093: GET /api/rooms/[code]
 *
 * Retrieves room information by code.
 * Returns room status, host info, game details, and player assignments.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { roomService } from '@/services/RoomService';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    // Await params (Next.js 15 requirement)
    const { code: roomCode } = await params;

    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Validate code format
    if (!roomCode || !/^[A-Z0-9]{6}$/i.test(roomCode)) {
      return NextResponse.json({ error: 'Código de sala inválido' }, { status: 400 });
    }

    // Get room info using RoomService
    const room = await roomService.getRoomByCode(roomCode.toUpperCase());

    return NextResponse.json(
      {
        success: true,
        data: {
          code: room.code,
          status: room.status,
          hostId: room.hostId,
          hostUsername: room.hostUsername,
          gameId: room.gameId,
          gameStatus: room.gameStatus,
          whitePlayerId: room.whitePlayerId,
          blackPlayerId: room.blackPlayerId,
          expiresAt: room.expiresAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const { code: roomCode } = await params;
    logger.error('Failed to get room via API', { error, code: roomCode });

    const statusCode =
      error instanceof Error && error.message.includes('não encontrada') ? 404 : 500;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao consultar sala',
      },
      { status: statusCode }
    );
  }
}
