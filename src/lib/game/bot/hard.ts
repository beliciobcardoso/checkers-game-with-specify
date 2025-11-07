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
 * Bot de dificuldade Difícil
 *
 * Estratégia:
 * - Algoritmo Minimax com poda Alpha-Beta
 * - Profundidade configurável (5-7 camadas)
 * - Ordenação de movimentos para melhor poda
 * - Avaliação heurística sofisticada
 * - Tempo de resposta: < 5 segundos
 */
export class HardBot {
  private color: Color;
  private readonly maxDepth: number;
  private readonly MAX_TIME_MS = 4900; // Margem de segurança para 5s
  private startTime: number = 0;
  private nodesEvaluated: number = 0;

  constructor(color: Color, depth: number = 6) {
    this.color = color;
    this.maxDepth = depth;
  }

  /**
   * Retorna o melhor movimento para o bot usando Minimax com Alpha-Beta
   * @param board Estado atual do tabuleiro
   * @returns Movimento selecionado
   * @throws Error se não houver movimentos válidos
   */
  getMove(board: BoardState): Move {
    this.startTime = Date.now();
    this.nodesEvaluated = 0;

    const myPieces = board.pieces.filter((p) => p.color === this.color);

    if (myPieces.length === 0) {
      throw new Error('Bot não tem peças no tabuleiro');
    }

    // Coletar e ordenar movimentos
    const possibleMoves = this.getAllPossibleMoves(board);

    if (possibleMoves.length === 0) {
      throw new Error('Bot não tem movimentos válidos');
    }

    // Ordenar movimentos para melhor poda (capturas primeiro)
    const orderedMoves = this.orderMoves(possibleMoves, board);

    let bestMove = orderedMoves[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;

    // Tentar profundidade iterativa se houver tempo
    for (let depth = Math.min(3, this.maxDepth); depth <= this.maxDepth; depth++) {
      if (Date.now() - this.startTime > this.MAX_TIME_MS * 0.8) {
        break;
      }

      let currentBest = orderedMoves[0];
      let currentBestScore = -Infinity;

      for (const move of orderedMoves) {
        if (Date.now() - this.startTime > this.MAX_TIME_MS) {
          break;
        }

        const score = this.minimax(move, board, depth - 1, alpha, beta, false);

        if (score > currentBestScore) {
          currentBestScore = score;
          currentBest = move;
        }

        alpha = Math.max(alpha, score);
      }

      if (currentBestScore > bestScore) {
        bestScore = currentBestScore;
        bestMove = currentBest;
      }
    }

    return bestMove;
  }

  /**
   * Algoritmo Minimax com poda Alpha-Beta
   */
  private minimax(
    move: Move,
    board: BoardState,
    depth: number,
    alpha: number,
    beta: number,
    maximizing: boolean
  ): number {
    this.nodesEvaluated++;

    // Timeout check
    if (Date.now() - this.startTime > this.MAX_TIME_MS) {
      return this.evaluatePosition(board);
    }

    // Simular movimento
    const game = createTempGame({ ...board, pieces: [...board.pieces] }, this.color);

    let newBoard: BoardState;
    try {
      const newGame = executeMove(move, game);
      newBoard = newGame.boardState;
    } catch {
      // Movimento inválido
      return maximizing ? -Infinity : Infinity;
    }

    // Caso base: profundidade 0 ou jogo terminou
    if (depth === 0) {
      return this.evaluatePosition(newBoard);
    }

    // Verificar fim de jogo
    const currentColor = maximizing ? this.color : this.getOpponentColor();
    const moves = this.getAllPossibleMovesForColor(newBoard, currentColor);

    if (moves.length === 0) {
      // Sem movimentos = derrota
      return maximizing ? -100000 : 100000;
    }

    // Ordenar movimentos para melhor poda
    const orderedMoves = this.orderMoves(moves, newBoard);

    if (maximizing) {
      let maxEval = -Infinity;
      for (const nextMove of orderedMoves) {
        const evaluation = this.minimax(nextMove, newBoard, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) {
          break; // Poda Beta
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const nextMove of orderedMoves) {
        const evaluation = this.minimax(nextMove, newBoard, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) {
          break; // Poda Alpha
        }
      }
      return minEval;
    }
  }

  /**
   * Ordena movimentos para melhorar eficiência da poda alpha-beta
   */
  private orderMoves(moves: Move[], board: BoardState): Move[] {
    return moves.sort((a, b) => {
      // Prioridade 1: Capturas
      const aIsCapture = Math.abs(a.to.row - a.from.row) === 2;
      const bIsCapture = Math.abs(b.to.row - b.from.row) === 2;

      if (aIsCapture && !bIsCapture) return -1;
      if (!aIsCapture && bIsCapture) return 1;

      // Prioridade 2: Movimentos de dama
      const aPiece = board.pieces.find((p) => p.id === a.pieceId);
      const bPiece = board.pieces.find((p) => p.id === b.pieceId);

      if (aPiece?.type === PieceType.KING && bPiece?.type !== PieceType.KING) return -1;
      if (aPiece?.type !== PieceType.KING && bPiece?.type === PieceType.KING) return 1;

      // Prioridade 3: Avanço de território
      const aAdvance = this.color === Color.WHITE ? a.from.row - a.to.row : a.to.row - a.from.row;
      const bAdvance = this.color === Color.WHITE ? b.from.row - b.to.row : b.to.row - b.from.row;

      return bAdvance - aAdvance;
    });
  }

  /**
   * Coleta todos os movimentos possíveis para o bot
   */
  private getAllPossibleMoves(board: BoardState): Move[] {
    return this.getAllPossibleMovesForColor(board, this.color);
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
   * Avalia a posição do tabuleiro (heurística sofisticada)
   */
  private evaluatePosition(board: BoardState): number {
    const myPieces = board.pieces.filter((p) => p.color === this.color);
    const opponentPieces = board.pieces.filter((p) => p.color === this.getOpponentColor());

    let score = 0;

    // 1. Material básico
    const myNormal = myPieces.filter((p) => p.type === PieceType.NORMAL).length;
    const myKings = myPieces.filter((p) => p.type === PieceType.KING).length;
    const opNormal = opponentPieces.filter((p) => p.type === PieceType.NORMAL).length;
    const opKings = opponentPieces.filter((p) => p.type === PieceType.KING).length;

    score += myNormal * 100;
    score += myKings * 180; // Damas valem mais
    score -= opNormal * 100;
    score -= opKings * 180;

    // 2. Vantagem material progressiva
    const materialDiff = myPieces.length - opponentPieces.length;
    score += materialDiff * 50;

    // 3. Avanço de território (peças próximas à promoção)
    for (const piece of myPieces) {
      if (piece.type === PieceType.NORMAL) {
        const distToPromo = this.color === Color.WHITE ? piece.row : 7 - piece.row;
        score += (7 - distToPromo) * 8;
      }
    }

    // 4. Controle do centro (colunas 2-5, linhas 2-5)
    for (const piece of myPieces) {
      if (piece.col >= 2 && piece.col <= 5 && piece.row >= 2 && piece.row <= 5) {
        score += 15;
      }
    }

    // 5. Mobilidade: peças com mais movimentos
    let myMobility = 0;
    let opMobility = 0;

    for (const piece of myPieces) {
      const moves = getValidMoves(piece, board);
      myMobility += moves.length;
    }

    for (const piece of opponentPieces) {
      const moves = getValidMoves(piece, board);
      opMobility += moves.length;
    }

    score += myMobility * 5;
    score -= opMobility * 5;

    // 6. Proteção: peças adjacentes (peões defendidos)
    for (const piece of myPieces) {
      const hasSupport = myPieces.some((other) => {
        if (other.id === piece.id) return false;
        const rowDiff = Math.abs(other.row - piece.row);
        const colDiff = Math.abs(other.col - piece.col);
        return rowDiff === 1 && colDiff === 1;
      });
      if (hasSupport) {
        score += 12;
      }
    }

    // 7. Penalizar peças na borda
    for (const piece of myPieces) {
      if (piece.col === 0 || piece.col === 7) {
        score -= 8;
      }
    }

    // 8. Bonus para damas no centro
    for (const piece of myPieces) {
      if (piece.type === PieceType.KING) {
        const centerDist = Math.abs(piece.row - 3.5) + Math.abs(piece.col - 3.5);
        score += (7 - centerDist) * 3;
      }
    }

    // 9. Endgame: quando poucas peças, damas valem ainda mais
    const totalPieces = board.pieces.length;
    if (totalPieces <= 8) {
      score += myKings * 50;
      score -= opKings * 50;
    }

    return score;
  }

  /**
   * Retorna a cor do oponente
   */
  private getOpponentColor(): Color {
    return this.color === Color.WHITE ? Color.BLACK : Color.WHITE;
  }

  /**
   * Retorna a cor do bot
   */
  getColor(): Color {
    return this.color;
  }

  /**
   * Retorna estatísticas da última análise
   */
  getStats() {
    return {
      nodesEvaluated: this.nodesEvaluated,
      maxDepth: this.maxDepth,
    };
  }
}
