/**
 * T091: POST /api/rooms
 *
 * Creates a new online multiplayer room and returns a shareable code.
 * The creator becomes the host and is assigned as the white player by default.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { roomService } from '@/services/RoomService';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Parse request body (optional: whitePlayerId override)
    const body = await request.json().catch(() => ({}));
    const { whitePlayerId } = body;

    // Create room using RoomService
    const room = await roomService.createRoom(session.user.id, whitePlayerId || session.user.id);

    logger.info(`Room created via API: ${room.code} by user ${session.user.id}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          code: room.code,
          status: room.status,
          hostId: room.hostId,
          gameId: room.gameId,
          expiresAt: room.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to create room via API', { error });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar sala',
      },
      { status: 500 }
    );
  }
}
