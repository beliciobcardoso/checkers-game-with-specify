import {
  Game,
  Move,
  Piece,
  BoardState,
  Color,
  PieceType,
  VictoryCheck,
  DrawCheck,
  Position,
} from '@/types/game';
import { validateSimpleMove, validateKingMove, findMultipleCaptures } from '@/lib/game/validator';
import { getPieceAt, getBoardHash, isValidPosition } from '@/lib/game/board';
import { MAX_TURNS_WITHOUT_CAPTURE, MAX_POSITION_REPETITIONS } from '@/lib/constants';

/**
 * Check if a piece should be promoted to king
 */
export function checkPromotion(piece: Piece): boolean {
  // Already a king
  if (piece.type === PieceType.KING) {
    return false;
  }

  // White pieces promote at row 0
  if (piece.color === Color.WHITE && piece.row === 0) {
    return true;
  }

  // Black pieces promote at row 7
  if (piece.color === Color.BLACK && piece.row === 7) {
    return true;
  }

  return false;
}

/**
 * Execute a move and update the game state
 */
export function executeMove(move: Move, game: Game): Game {
  const piece = game.boardState.pieces.find((p) => p.id === move.pieceId);

  if (!piece) {
    throw new Error(`Piece ${move.pieceId} not found`);
  }

  // Create a new board state
  const newBoardState: BoardState = {
    pieces: [...game.boardState.pieces],
    capturedPieces: { ...game.boardState.capturedPieces },
    positionHistory: [...game.boardState.positionHistory],
  };

  // Check if this is a capture move
  const rowDiff = Math.abs(move.to.row - move.from.row);
  const isCapture = rowDiff === 2;

  let capturedPiece: Piece | undefined;

  if (isCapture) {
    // Remove captured piece
    const middleRow = (move.from.row + move.to.row) / 2;
    const middleCol = (move.from.col + move.to.col) / 2;
    const foundPiece = getPieceAt(middleRow, middleCol, newBoardState);

    if (foundPiece) {
      capturedPiece = foundPiece;
      newBoardState.pieces = newBoardState.pieces.filter((p) => p.id !== capturedPiece?.id);

      // Update captured count
      if (capturedPiece.color === Color.WHITE) {
        newBoardState.capturedPieces.white++;
      } else {
        newBoardState.capturedPieces.black++;
      }
    }
  }

  // Update piece position
  const pieceIndex = newBoardState.pieces.findIndex((p) => p.id === piece.id);
  if (pieceIndex !== -1) {
    newBoardState.pieces[pieceIndex] = {
      ...newBoardState.pieces[pieceIndex],
      row: move.to.row,
      col: move.to.col,
    };

    // Check for promotion
    if (checkPromotion(newBoardState.pieces[pieceIndex])) {
      newBoardState.pieces[pieceIndex].type = PieceType.KING;
    }
  }

  // Add current position to history
  const boardHash = getBoardHash(newBoardState);
  newBoardState.positionHistory.push(boardHash);

  // Switch turns
  const newTurn = game.currentTurn === Color.WHITE ? Color.BLACK : Color.WHITE;

  // Create updated game
  const updatedGame: Game = {
    ...game,
    boardState: newBoardState,
    currentTurn: newTurn,
    moveCount: game.moveCount + 1,
    updatedAt: new Date(),
  };

  return updatedGame;
}

/**
 * Check if the game has been won
 */
export function checkVictory(game: Game): VictoryCheck {
  const whitePieces = game.boardState.pieces.filter((p) => p.color === Color.WHITE);
  const blackPieces = game.boardState.pieces.filter((p) => p.color === Color.BLACK);

  // Check if either player has no pieces
  if (whitePieces.length === 0) {
    return { isVictory: true, winner: Color.BLACK };
  }
  if (blackPieces.length === 0) {
    return { isVictory: true, winner: Color.WHITE };
  }

  // Check if current player has no valid moves
  const currentPlayerPieces = game.currentTurn === Color.WHITE ? whitePieces : blackPieces;
  const hasValidMoves = currentPlayerPieces.some(
    (piece) => getValidMoves(piece, game.boardState).length > 0
  );

  if (!hasValidMoves) {
    // Current player can't move, opponent wins
    const winner = game.currentTurn === Color.WHITE ? Color.BLACK : Color.WHITE;
    return { isVictory: true, winner };
  }

  return { isVictory: false, winner: null };
}

/**
 * Check if the game is a draw
 */
export function checkDraw(game: Game): DrawCheck {
  // Check for 40 moves without capture
  if (game.moveCount >= MAX_TURNS_WITHOUT_CAPTURE) {
    // In a real implementation, we'd track moves since last capture
    // For now, we'll use a simplified check based on move count
    return {
      isDraw: true,
      reason: `Empate por ${MAX_TURNS_WITHOUT_CAPTURE} movimentos sem captura`,
    };
  }

  // Check for position repetition
  const positionCounts: Record<string, number> = {};
  game.boardState.positionHistory.forEach((hash) => {
    positionCounts[hash] = (positionCounts[hash] || 0) + 1;
  });

  for (const count of Object.values(positionCounts)) {
    if (count >= MAX_POSITION_REPETITIONS) {
      return {
        isDraw: true,
        reason: `Empate por repetição de posição ${MAX_POSITION_REPETITIONS}x`,
      };
    }
  }

  return { isDraw: false };
}

/**
 * Get all valid moves for a piece (for highlighting)
 */
export function getValidMoves(piece: Piece, board: BoardState): Position[] {
  const validMoves: Position[] = [];

  // First, check for captures (captures are mandatory in checkers)
  const capturePaths = findMultipleCaptures(piece, board);

  if (capturePaths.length > 0) {
    // Return only the first destination of each capture path
    // For a capture from (5,0) over (4,1), the destination is (3,2)
    const capturePositions: Position[] = [];

    for (const path of capturePaths) {
      // The first position in the path is the immediate destination after the first capture
      if (path.positions.length > 0) {
        // For a capture move, the destination is 2 squares away
        // We need to find the destination, not the captured piece position
        const firstCaptured = path.capturedPieces[0];

        // Calculate the destination based on the captured piece
        // If piece is at (5,0) and captures at (4,1), destination is (3,2)
        const rowDiff = firstCaptured.row - piece.row;
        const colDiff = firstCaptured.col - piece.col;
        const destRow = firstCaptured.row + rowDiff;
        const destCol = firstCaptured.col + colDiff;

        capturePositions.push({ row: destRow, col: destCol });
      }
    }

    // Remove duplicates
    const uniquePositions = capturePositions.filter(
      (pos, index, self) => index === self.findIndex((p) => p.row === pos.row && p.col === pos.col)
    );
    return uniquePositions;
  }

  // If no captures available, check simple moves
  if (piece.type === PieceType.KING) {
    // King can move in all 4 diagonal directions
    const directions = [
      { row: -1, col: -1 },
      { row: -1, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 1 },
    ];

    for (const dir of directions) {
      // Kings can move multiple squares
      for (let distance = 1; distance < 8; distance++) {
        const toRow = piece.row + dir.row * distance;
        const toCol = piece.col + dir.col * distance;

        if (!isValidPosition(toRow, toCol)) break;

        const pieceAtDest = getPieceAt(toRow, toCol, board);
        if (pieceAtDest) break; // Path blocked

        const result = validateKingMove(piece, toRow, toCol, board);
        if (result.valid) {
          validMoves.push({ row: toRow, col: toCol });
        } else {
          break; // Can't move further in this direction
        }
      }
    }
  } else {
    // Normal piece - check 2 forward diagonal squares
    const forwardDir = piece.color === Color.WHITE ? -1 : 1;

    const possibleMoves = [
      { row: piece.row + forwardDir, col: piece.col - 1 },
      { row: piece.row + forwardDir, col: piece.col + 1 },
    ];

    for (const move of possibleMoves) {
      // Skip if move is out of bounds
      if (!isValidPosition(move.row, move.col)) continue;

      const result = validateSimpleMove(piece, move.row, move.col, board);
      if (result.valid) {
        validMoves.push({ row: move.row, col: move.col });
      }
    }
  }

  return validMoves;
}
