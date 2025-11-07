/**
 * T112: useOnlineGame Hook
 *
 * Manages state for online multiplayer games.
 * Integrates with useWebSocket to synchronize moves and game state.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { Color, GameStatus } from '@/types/game';
import type { BoardState, Position } from '@/types/game';
import { logger } from '@/lib/logger';

interface UseOnlineGameProps {
  gameId: string;
  playerId: string;
}

interface OnlineGameState {
  id: string;
  boardState: BoardState;
  currentTurn: Color;
  status: GameStatus;
  whitePlayerId: string;
  blackPlayerId: string;
  winner?: Color;
}

interface UseOnlineGameReturn {
  gameState: OnlineGameState | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  isMyTurn: boolean;
  myColor: Color | null;
  makeMove: (from: Position, to: Position) => Promise<void>;
  resign: () => Promise<void>;
  error: string | null;
  loading: boolean;
}

interface GameMoveEvent {
  gameId: string;
  move: {
    from: Position;
    to: Position;
    capturedPieces?: Position[];
  };
  newBoard: BoardState;
  currentTurn: Color;
  status: GameStatus;
}

interface OpponentResignedEvent {
  gameId: string;
  winnerId: string;
}

interface GameStateUpdateEvent {
  gameId: string;
  gameState: OnlineGameState;
}

export function useOnlineGame({ gameId, playerId }: UseOnlineGameProps): UseOnlineGameReturn {
  const { socket, status, emit, on, off } = useWebSocket();
  const [gameState, setGameState] = useState<OnlineGameState | null>(null);
  const [myColor, setMyColor] = useState<Color | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Fetch initial game state
  useEffect(() => {
    async function fetchGameState() {
      try {
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) {
          throw new Error('Failed to load game');
        }

        const data = await response.json();

        if (mountedRef.current) {
          setGameState(data.game);

          // Determine player color
          const color: Color = data.game.whitePlayerId === playerId ? Color.WHITE : Color.BLACK;
          setMyColor(color);
          setLoading(false);
        }
      } catch (err) {
        logger.error('Error fetching game state', { gameId, error: err });
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : 'Failed to load game');
          setLoading(false);
        }
      }
    }

    fetchGameState();
  }, [gameId, playerId]);

  // Join game room on connection
  useEffect(() => {
    if (socket && status === 'connected' && gameId) {
      emit('JOIN_ROOM', { gameId, playerId });
      logger.info('Joined game room', { gameId, playerId });
    }
  }, [socket, status, gameId, playerId, emit]);

  // Handle game move events
  useEffect(() => {
    if (!socket) return;

    const handleMoveMade = (event: unknown) => {
      const moveEvent = event as GameMoveEvent;
      if (moveEvent.gameId !== gameId) return;

      logger.info('Move received', { gameId, move: moveEvent.move });

      if (mountedRef.current && gameState) {
        setGameState({
          ...gameState,
          boardState: moveEvent.newBoard,
          currentTurn: moveEvent.currentTurn,
          status: moveEvent.status,
        });
      }
    };

    const handleMoveError = (event: unknown) => {
      const errorEvent = event as { error: string };
      logger.error('Move error', { error: errorEvent.error });
      if (mountedRef.current) {
        setError(errorEvent.error);
      }
    };

    const handleOpponentResigned = (event: unknown) => {
      const resignEvent = event as OpponentResignedEvent;
      if (resignEvent.gameId !== gameId) return;

      logger.info('Opponent resigned', { gameId });

      if (mountedRef.current && gameState) {
        setGameState({
          ...gameState,
          status: GameStatus.FINISHED,
          winner:
            playerId === resignEvent.winnerId
              ? myColor!
              : myColor === Color.WHITE
                ? Color.BLACK
                : Color.WHITE,
        });
      }
    };

    const handleGameStateUpdate = (event: unknown) => {
      const updateEvent = event as GameStateUpdateEvent;
      if (updateEvent.gameId !== gameId) return;

      logger.info('Game state updated', { gameId });

      if (mountedRef.current) {
        setGameState(updateEvent.gameState);
      }
    };

    on('move-made', handleMoveMade);
    on('move-error', handleMoveError);
    on('opponent-resigned', handleOpponentResigned);
    on('game-state-update', handleGameStateUpdate);

    return () => {
      off('move-made', handleMoveMade);
      off('move-error', handleMoveError);
      off('opponent-resigned', handleOpponentResigned);
      off('game-state-update', handleGameStateUpdate);
    };
  }, [socket, gameId, playerId, gameState, myColor, on, off]);

  // Make move
  const makeMove = useCallback(
    async (from: Position, to: Position) => {
      if (!socket || status !== 'connected') {
        setError('Not connected to server');
        return;
      }

      if (!gameState || gameState.status !== GameStatus.IN_PROGRESS) {
        setError('Game is not in progress');
        return;
      }

      if (gameState.currentTurn !== myColor) {
        setError('Not your turn');
        return;
      }

      setError(null);

      emit('GAME_MOVE', {
        gameId,
        playerId,
        from,
        to,
      });

      logger.info('Move emitted', { gameId, from, to });
    },
    [socket, status, gameState, myColor, gameId, playerId, emit]
  );

  // Resign game
  const resign = useCallback(async () => {
    if (!socket || status !== 'connected') {
      setError('Not connected to server');
      return;
    }

    try {
      const response = await fetch(`/api/games/${gameId}/resign`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to resign');
      }

      emit('resign-game', { gameId, playerId });
      logger.info('Resigned from game', { gameId });
    } catch (err) {
      logger.error('Error resigning', { gameId, error: err });
      setError(err instanceof Error ? err.message : 'Failed to resign');
    }
  }, [socket, status, gameId, playerId, emit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isMyTurn = gameState ? gameState.currentTurn === myColor : false;

  return {
    gameState,
    connectionStatus: status,
    isMyTurn,
    myColor,
    makeMove,
    resign,
    error,
    loading,
  };
}
