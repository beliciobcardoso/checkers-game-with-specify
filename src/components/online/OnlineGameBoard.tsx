/**
 * T108: OnlineGameBoard Component
 *
 * Online game board that integrates with WebSocket for real-time multiplayer.
 * Reuses the base Board component and adds online synchronization.
 */

'use client';

import { useState } from 'react';
import { Board } from '@/components/game/Board';
import { useOnlineGame } from '@/hooks/useOnlineGame';
import type { Position } from '@/types/game';
import { ConnectionStatus } from './ConnectionStatus';
import { getValidMoves } from '@/lib/game/engine';
import { getPieceAt } from '@/lib/game/board';

interface OnlineGameBoardProps {
  gameId: string;
  playerId: string;
  onResign?: () => void;
}

export function OnlineGameBoard({ gameId, playerId, onResign }: OnlineGameBoardProps) {
  const { gameState, connectionStatus, isMyTurn, myColor, makeMove, resign, error, loading } =
    useOnlineGame({ gameId, playerId });

  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);

  const handleSquareClick = async (row: number, col: number) => {
    if (!gameState || !isMyTurn || connectionStatus !== 'connected') return;

    // If no piece selected, try to select one
    if (!selectedPiece) {
      const piece = getPieceAt(row, col, gameState.boardState);

      if (piece && piece.color === gameState.currentTurn) {
        const moves = getValidMoves(piece, gameState.boardState);

        if (moves.length > 0) {
          setSelectedPiece({ row, col });
          setValidMoves(moves);
        }
      }
      return;
    }

    // If clicking the same piece, deselect
    if (selectedPiece.row === row && selectedPiece.col === col) {
      setSelectedPiece(null);
      setValidMoves([]);
      return;
    }

    // Check if clicked position is a valid move
    const isValidMove = validMoves.some((move) => move.row === row && move.col === col);

    if (isValidMove) {
      await makeMove(selectedPiece, { row, col });
      setSelectedPiece(null);
      setValidMoves([]);
    } else {
      // Try to select a different piece
      const piece = getPieceAt(row, col, gameState.boardState);

      if (piece && piece.color === gameState.currentTurn) {
        const moves = getValidMoves(piece, gameState.boardState);

        if (moves.length > 0) {
          setSelectedPiece({ row, col });
          setValidMoves(moves);
        }
      } else {
        setSelectedPiece(null);
        setValidMoves([]);
      }
    }
  };

  const handleResign = async () => {
    if (window.confirm('Você tem certeza que deseja desistir da partida?')) {
      await resign();
      onResign?.();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="text-2xl mb-2">⌛</div>
          <p className="text-gray-500">Carregando partida...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center text-red-500">
          <p className="text-2xl mb-2">❌</p>
          <p>Erro ao carregar partida</p>
          {error && <p className="text-sm mt-1">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex justify-between items-center">
        <ConnectionStatus status={connectionStatus} />

        <div className="flex gap-2 items-center">
          {/* Turn Indicator */}
          <div
            className={`px-3 py-1 rounded text-sm font-medium ${
              isMyTurn
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {isMyTurn ? 'Sua vez' : 'Aguardando oponente'}
          </div>

          {/* Player Color */}
          <div className="px-3 py-1 rounded text-sm bg-gray-100 dark:bg-gray-800">
            Você: {myColor === 'WHITE' ? 'Brancas ⚪' : 'Pretas ⚫'}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Board */}
      <Board
        boardState={gameState.boardState}
        selectedPiece={selectedPiece}
        validMoves={validMoves}
        onSquareClick={handleSquareClick}
      />

      {/* Game Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {gameState.status === 'FINISHED' && (
            <span className="font-medium text-lg">
              {gameState.winner === myColor ? '🎉 Você venceu!' : '😔 Você perdeu'}
            </span>
          )}
          {gameState.status === 'ABANDONED' && (
            <span className="text-yellow-600 dark:text-yellow-400">⚠️ Partida abandonada</span>
          )}
        </div>

        {gameState.status === 'IN_PROGRESS' && (
          <button
            onClick={handleResign}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={connectionStatus !== 'connected'}
          >
            Desistir
          </button>
        )}
      </div>
    </div>
  );
}
