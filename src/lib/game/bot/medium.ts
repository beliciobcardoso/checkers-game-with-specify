import { BoardState, Color, Move, PieceType, Game, GameStatus, GameType } from '@/types/game';
import { getValidMoves, executeMove } from '@/lib/game/engine';
import { findMultipleCaptures } from '@/lib/game/validator';

/**
 * Cria um Game temporário para simulação
 */
function createTempGame(board: BoardState, currentPlayer: Color): Game {
  return {
    id: 'temp',
    type: GameType.BOT,
    status: GameStatus.IN_PROGRESS,
    boardState: board,
    currentTurn: currentPlayer,
    moveCount: 0,
    result: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Bot de dificuldade Média
 *
 * Estratégia:
 * - Análise de 2-3 jogadas adiante (lookahead)
 * - Avaliação heurística de posição
 * - Prioriza capturas e avanço de território
 * - Tempo de resposta: < 2 segundos
 */
export class MediumBot {
  private color: Color;
  private readonly MAX_DEPTH = 3;
  private readonly MAX_TIME_MS = 1900; // Margem de segurança para 2s
  private startTime: number = 0;

  constructor(color: Color) {
    this.color = color;
  }

  /**
   * Retorna o melhor movimento para o bot
   * @param board Estado atual do tabuleiro
   * @returns Movimento selecionado
   * @throws Error se não houver movimentos válidos
   */
  getMove(board: BoardState): Move {
    this.startTime = Date.now();

    const myPieces = board.pieces.filter((p) => p.color === this.color);

    if (myPieces.length === 0) {
      throw new Error('Bot não tem peças no tabuleiro');
    }

    // Coletar todos os movimentos possíveis
    const possibleMoves = this.getAllPossibleMoves(board);

    if (possibleMoves.length === 0) {
      throw new Error('Bot não tem movimentos válidos');
    }

    // Avaliar cada movimento usando lookahead
    let bestMove = possibleMoves[0];
    let bestScore = -Infinity;

    for (const move of possibleMoves) {
      // Verificar timeout
      if (Date.now() - this.startTime > this.MAX_TIME_MS) {
        break;
      }

      const score = this.evaluateMove(move, board, this.MAX_DEPTH);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  /**
   * Coleta todos os movimentos possíveis para o bot
   */
  private getAllPossibleMoves(board: BoardState): Move[] {
    const moves: Move[] = [];
    const myPieces = board.pieces.filter((p) => p.color === this.color);

    for (const piece of myPieces) {
      // Verificar capturas primeiro
      const captures = findMultipleCaptures(piece, board);

      if (captures.length > 0) {
        for (const capturePath of captures) {
          if (capturePath.capturedPieces.length > 0) {
            const firstCaptured = capturePath.capturedPieces[0];
            const rowDiff = firstCaptured.row - piece.row;
            const colDiff = firstCaptured.col - piece.col;
            const destRow = firstCaptured.row + rowDiff;
            const destCol = firstCaptured.col + colDiff;

            moves.push({
              pieceId: piece.id,
              from: { row: piece.row, col: piece.col },
              to: { row: destRow, col: destCol },
            });
          }
        }
      }

      // Adicionar movimentos simples
      const validMoves = getValidMoves(piece, board);
      for (const moveTo of validMoves) {
        const rowDiff = Math.abs(moveTo.row - piece.row);
        if (rowDiff === 1) {
          moves.push({
            pieceId: piece.id,
            from: { row: piece.row, col: piece.col },
            to: moveTo,
          });
        }
      }
    }

    return moves;
  }

  /**
   * Avalia um movimento usando lookahead e heurística
   */
  private evaluateMove(move: Move, board: BoardState, depth: number): number {
    // Timeout check
    if (Date.now() - this.startTime > this.MAX_TIME_MS) {
      return this.evaluatePosition(board);
    }

    // Simular movimento
    const game = createTempGame({ ...board, pieces: [...board.pieces] }, this.color);

    try {
      const newGame = executeMove(move, game);
      const newBoard = newGame.boardState;

      // Avaliar posição resultante
      let score = this.evaluatePosition(newBoard);

      // Se não chegou na profundidade máxima, continuar lookahead
      if (depth > 1) {
        // Simular resposta do oponente (pior caso)
        const opponentColor = this.color === Color.WHITE ? Color.BLACK : Color.WHITE;
        const opponentMoves = this.getAllPossibleMovesForColor(newBoard, opponentColor);

        if (opponentMoves.length > 0) {
          // Assumir que oponente faz o melhor movimento
          let worstOpponentScore = Infinity;

          for (const opMove of opponentMoves.slice(0, 5)) {
            // Limitar para performance
            const opScore = this.evaluateMoveForColor(opMove, newBoard, opponentColor, depth - 1);
            worstOpponentScore = Math.min(worstOpponentScore, opScore);

            if (Date.now() - this.startTime > this.MAX_TIME_MS) {
              break;
            }
          }

          score -= worstOpponentScore * 0.8; // Peso para movimento oponente
        }
      }

      return score;
    } catch {
      // Movimento inválido
      return -Infinity;
    }
  }

  /**
   * Avalia movimento para uma cor específica
   */
  private evaluateMoveForColor(
    move: Move,
    board: BoardState,
    color: Color,
    _depth: number
  ): number {
    if (Date.now() - this.startTime > this.MAX_TIME_MS) {
      return this.evaluatePositionForColor(board, color);
    }

    const game = createTempGame({ ...board, pieces: [...board.pieces] }, color);

    try {
      const newGame = executeMove(move, game);
      return this.evaluatePositionForColor(newGame.boardState, color);
    } catch {
      return -Infinity;
    }
  }

  /**
   * Coleta movimentos para uma cor específica
   */
  private getAllPossibleMovesForColor(board: BoardState, color: Color): Move[] {
    const moves: Move[] = [];
    const pieces = board.pieces.filter((p) => p.color === color);

    for (const piece of pieces) {
      const captures = findMultipleCaptures(piece, board);

      if (captures.length > 0) {
        for (const capturePath of captures) {
          if (capturePath.capturedPieces.length > 0) {
            const firstCaptured = capturePath.capturedPieces[0];
            const rowDiff = firstCaptured.row - piece.row;
            const colDiff = firstCaptured.col - piece.col;
            const destRow = firstCaptured.row + rowDiff;
            const destCol = firstCaptured.col + colDiff;

            moves.push({
              pieceId: piece.id,
              from: { row: piece.row, col: piece.col },
              to: { row: destRow, col: destCol },
            });
          }
        }
      }

      const validMoves = getValidMoves(piece, board);
      for (const moveTo of validMoves) {
        const rowDiff = Math.abs(moveTo.row - piece.row);
        if (rowDiff === 1) {
          moves.push({
            pieceId: piece.id,
            from: { row: piece.row, col: piece.col },
            to: moveTo,
          });
        }
      }
    }

    return moves;
  }

  /**
   * Avalia a posição do tabuleiro para o bot
   */
  private evaluatePosition(board: BoardState): number {
    return this.evaluatePositionForColor(board, this.color);
  }

  /**
   * Avalia a posição do tabuleiro para uma cor específica
   */
  private evaluatePositionForColor(board: BoardState, color: Color): number {
    const opponentColor = color === Color.WHITE ? Color.BLACK : Color.WHITE;
    const myPieces = board.pieces.filter((p) => p.color === color);
    const opponentPieces = board.pieces.filter((p) => p.color === opponentColor);

    let score = 0;

    // 1. Material: Peças no tabuleiro
    score += myPieces.length * 100;
    score -= opponentPieces.length * 100;

    // 2. Damas valem mais
    const myKings = myPieces.filter((p) => p.type === PieceType.KING).length;
    const opponentKings = opponentPieces.filter((p) => p.type === PieceType.KING).length;
    score += myKings * 50;
    score -= opponentKings * 50;

    // 3. Avanço de território (peças próximas à promoção)
    for (const piece of myPieces) {
      if (piece.type === PieceType.NORMAL) {
        const distToPromo = color === Color.WHITE ? piece.row : 7 - piece.row;
        score += (7 - distToPromo) * 5; // Quanto mais próximo, mais pontos
      }
    }

    // 4. Controle do centro (colunas 2-5)
    for (const piece of myPieces) {
      if (piece.col >= 2 && piece.col <= 5) {
        score += 10;
      }
    }

    // 5. Mobilidade: peças com mais movimentos são melhores
    for (const piece of myPieces) {
      const moves = getValidMoves(piece, board);
      score += moves.length * 2;
    }

    // 6. Penalizar peças na borda (menos mobilidade)
    for (const piece of myPieces) {
      if (piece.col === 0 || piece.col === 7) {
        score -= 5;
      }
    }

    return score;
  }

  /**
   * Retorna a cor do bot
   */
  getColor(): Color {
    return this.color;
  }
}
