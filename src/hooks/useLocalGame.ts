import { useState, useCallback } from 'react';
import {
  Game,
  Color,
  GameStatus,
  GameType,
  Position,
  GameResult,
} from '@/types/game';
import { createInitialBoard, getPieceAt } from '@/lib/game/board';
import {
  executeMove,
  checkVictory,
  checkDraw,
  getValidMoves,
} from '@/lib/game/engine';

interface UseLocalGameReturn {
  game: Game;
  selectedPiece: Position | null;
  validMoves: Position[];
  winner: Color | null;
  handleSquareClick: (row: number, col: number) => void;
  resetGame: () => void;
}

/**
 * Custom hook for managing local game state and logic
 * 
 * Handles piece selection, move execution, victory/draw detection,
 * and game reset for local two-player games
 */
export function useLocalGame(): UseLocalGameReturn {
  // Initialize game state
  const [game, setGame] = useState<Game>(() => createInitialGame());
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [winner, setWinner] = useState<Color | null>(null);

  /**
   * Create a new game instance
   */
  function createInitialGame(): Game {
    const boardState = createInitialBoard();
    
    return {
      id: `local-${Date.now()}`,
      type: GameType.LOCAL,
      status: GameStatus.IN_PROGRESS,
      boardState,
      currentTurn: Color.WHITE,
      moveCount: 0,
      result: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Handle square click - select piece or move piece
   */
  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      // Ignore clicks if game is over
      if (game.status !== GameStatus.IN_PROGRESS) {
        return;
      }

      const clickedPiece = getPieceAt(row, col, game.boardState);

      // Case 1: Clicked on a valid move destination
      if (
        selectedPiece &&
        validMoves.some((move) => move.row === row && move.col === col)
      ) {
        const piece = getPieceAt(
          selectedPiece.row,
          selectedPiece.col,
          game.boardState,
        );

        if (piece) {
          // Execute the move
          const updatedGame = executeMove(
            {
              from: selectedPiece,
              to: { row, col },
              pieceId: piece.id,
            },
            game,
          );

          // Check for victory
          const victoryCheck = checkVictory(updatedGame);
          if (victoryCheck.isVictory) {
            updatedGame.status = GameStatus.FINISHED;
            updatedGame.result =
              victoryCheck.winner === Color.WHITE
                ? GameResult.WHITE_WIN
                : GameResult.BLACK_WIN;
            setWinner(victoryCheck.winner);
          }

          // Check for draw
          const drawCheck = checkDraw(updatedGame);
          if (drawCheck.isDraw && !victoryCheck.isVictory) {
            updatedGame.status = GameStatus.FINISHED;
            updatedGame.result = GameResult.DRAW;
            setWinner(null);
          }

          setGame(updatedGame);
          setSelectedPiece(null);
          setValidMoves([]);
        }
        return;
      }

      // Case 2: Clicked on own piece - select it
      if (clickedPiece && clickedPiece.color === game.currentTurn) {
        setSelectedPiece({ row, col });
        const moves = getValidMoves(clickedPiece, game.boardState);
        setValidMoves(moves);
        return;
      }

      // Case 3: Clicked on empty square or opponent piece - deselect
      setSelectedPiece(null);
      setValidMoves([]);
    },
    [game, selectedPiece, validMoves],
  );

  /**
   * Reset the game to initial state
   */
  const resetGame = useCallback(() => {
    setGame(createInitialGame());
    setSelectedPiece(null);
    setValidMoves([]);
    setWinner(null);
  }, []);

  return {
    game,
    selectedPiece,
    validMoves,
    winner,
    handleSquareClick,
    resetGame,
  };
}
