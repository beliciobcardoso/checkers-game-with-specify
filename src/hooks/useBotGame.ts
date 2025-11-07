'use client';

import { useState, useCallback, useEffect } from 'react';
import { Game, Move, Position, GameStatus } from '@/types/game';
import { BotDifficulty } from '@/lib/game/bot/factory';

interface UseBotGameOptions {
  gameId: string;
  initialGame?: Game;
  onGameOver?: (game: Game) => void;
  onError?: (error: Error) => void;
}

interface UseBotGameReturn {
  game: Game | null;
  loading: boolean;
  error: Error | null;
  selectedPiece: Position | null;
  validMoves: Position[];
  isBotThinking: boolean;
  selectPiece: (position: Position) => void;
  makeMove: (to: Position) => Promise<void>;
  handleSquareClick: (row: number, col: number) => void;
  botDifficulty?: BotDifficulty;
}

/**
 * Hook para gerenciar estado e lógica de partida contra bot
 * Handles player moves, triggers bot moves, manages game state
 */
export function useBotGame({
  gameId,
  initialGame,
  onGameOver,
  onError,
}: UseBotGameOptions): UseBotGameReturn {
  const [game, setGame] = useState<Game | null>(initialGame || null);
  const [loading, setLoading] = useState(!initialGame);
  const [error, setError] = useState<Error | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [isBotThinking, setIsBotThinking] = useState(false);

  const loadGame = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/games/${gameId}`);

      if (!response.ok) {
        throw new Error('Falha ao carregar jogo');
      }

      const data = await response.json();
      setGame(data.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [gameId, onError]);

  const checkBotTurn = useCallback(async () => {
    if (!game || game.status !== GameStatus.IN_PROGRESS || isBotThinking) {
      return;
    }

    // Check if it's bot's turn (simplified - you might need more logic)
    const isPlayerWhite = game.whitePlayerId !== null;
    const isPlayerBlack = game.blackPlayerId !== null;
    const isBotTurn =
      (isPlayerWhite && game.currentTurn === 'BLACK') ||
      (isPlayerBlack && game.currentTurn === 'WHITE');

    if (isBotTurn) {
      try {
        setIsBotThinking(true);

        const response = await fetch(`/api/games/${gameId}/bot-move`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Falha ao executar movimento do bot');
        }

        const data = await response.json();
        setGame(data.data);

        // Check if game is over
        if (data.data.status === GameStatus.FINISHED) {
          onGameOver?.(data.data);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro ao executar movimento do bot');
        setError(error);
        onError?.(error);
      } finally {
        setIsBotThinking(false);
      }
    }
  }, [game, isBotThinking, gameId, onGameOver, onError]);

  // Load game data
  useEffect(() => {
    if (!initialGame && gameId) {
      loadGame();
    }
  }, [gameId, initialGame, loadGame]);

  // Trigger bot move if it's bot's turn
  useEffect(() => {
    if (game && !loading && !isBotThinking) {
      checkBotTurn();
    }
  }, [game, loading, isBotThinking, checkBotTurn]);

  const selectPiece = useCallback(
    (position: Position) => {
      if (!game || isBotThinking) return;

      setSelectedPiece(position);
      // Simplified: Let the API validate moves
      setValidMoves([]);
    },
    [game, isBotThinking]
  );

  const makeMove = useCallback(
    async (to: Position) => {
      if (!game || !selectedPiece || isBotThinking) return;

      try {
        // Find the piece at selected position
        const piece = game.boardState.pieces.find(
          (p) => p.row === selectedPiece.row && p.col === selectedPiece.col
        );

        if (!piece) {
          throw new Error('Peça não encontrada');
        }

        const move: Move = {
          from: selectedPiece,
          to,
          pieceId: piece.id,
        };

        const response = await fetch(`/api/games/${gameId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ move }),
        });

        if (!response.ok) {
          throw new Error('Movimento inválido');
        }

        const data = await response.json();
        setGame(data.data);
        setSelectedPiece(null);
        setValidMoves([]);

        // Check if game is over
        if (data.data.status === GameStatus.FINISHED) {
          onGameOver?.(data.data);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro ao fazer movimento');
        setError(error);
        onError?.(error);
      }
    },
    [game, selectedPiece, gameId, isBotThinking, onGameOver, onError]
  );

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (!game || isBotThinking) return;

      const clickedPosition: Position = { row, col };

      // If a piece is selected and this is a valid move
      if (selectedPiece && validMoves.some((m) => m.row === row && m.col === col)) {
        makeMove(clickedPosition);
      } else {
        // Select this piece if it belongs to the current player
        selectPiece(clickedPosition);
      }
    },
    [game, selectedPiece, validMoves, isBotThinking, selectPiece, makeMove]
  );

  return {
    game,
    loading,
    error,
    selectedPiece,
    validMoves,
    isBotThinking,
    selectPiece,
    makeMove,
    handleSquareClick,
    botDifficulty: game?.botDifficulty as BotDifficulty | undefined,
  };
}
