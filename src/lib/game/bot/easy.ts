import { BoardState, Color, Move, Position } from '@/types/game';
import { getValidMoves } from '@/lib/game/engine';
import { findMultipleCaptures } from '@/lib/game/validator';

/**
 * Bot de dificuldade Fácil
 *
 * Estratégia:
 * - Movimentos aleatórios ponderados
 * - Prefere capturas (60% das vezes)
 * - Evita movimentos obviamente ruins
 * - Tempo de resposta: < 1 segundo
 */
export class EasyBot {
  private color: Color;

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
    const myPieces = board.pieces.filter((p) => p.color === this.color);

    if (myPieces.length === 0) {
      throw new Error('Bot não tem peças no tabuleiro');
    }

    // Coletar todos os movimentos possíveis
    const allMoves: Array<{ pieceId: string; from: Position; to: Position; isCapture: boolean }> =
      [];

    for (const piece of myPieces) {
      // Verificar capturas primeiro
      const captures = findMultipleCaptures(piece, board);

      if (captures.length > 0) {
        // Adicionar apenas o primeiro destino de cada captura
        for (const capturePath of captures) {
          if (capturePath.capturedPieces.length > 0) {
            const firstCaptured = capturePath.capturedPieces[0];
            const rowDiff = firstCaptured.row - piece.row;
            const colDiff = firstCaptured.col - piece.col;
            const destRow = firstCaptured.row + rowDiff;
            const destCol = firstCaptured.col + colDiff;

            allMoves.push({
              pieceId: piece.id,
              from: { row: piece.row, col: piece.col },
              to: { row: destRow, col: destCol },
              isCapture: true,
            });
          }
        }
      }

      // Adicionar movimentos simples
      const validMoves = getValidMoves(piece, board);
      for (const moveTo of validMoves) {
        // Verificar se não é captura (capturas já foram adicionadas)
        const rowDiff = Math.abs(moveTo.row - piece.row);
        if (rowDiff === 1) {
          allMoves.push({
            pieceId: piece.id,
            from: { row: piece.row, col: piece.col },
            to: moveTo,
            isCapture: false,
          });
        }
      }
    }

    if (allMoves.length === 0) {
      throw new Error('Bot não tem movimentos válidos');
    }

    // Separar capturas e movimentos simples
    const captures = allMoves.filter((m) => m.isCapture);
    const simpleMoves = allMoves.filter((m) => !m.isCapture);

    // Estratégia: preferir capturas 60% das vezes quando disponíveis
    let selectedMove: (typeof allMoves)[0];

    if (captures.length > 0) {
      const shouldCapture = Math.random() < 0.6;

      if (shouldCapture || simpleMoves.length === 0) {
        // Escolher captura aleatória
        selectedMove = captures[Math.floor(Math.random() * captures.length)];
      } else {
        // Escolher movimento simples aleatório
        selectedMove = simpleMoves[Math.floor(Math.random() * simpleMoves.length)];
      }
    } else {
      // Sem capturas disponíveis, escolher movimento simples aleatório
      selectedMove = simpleMoves[Math.floor(Math.random() * simpleMoves.length)];
    }

    return {
      pieceId: selectedMove.pieceId,
      from: selectedMove.from,
      to: selectedMove.to,
    };
  }

  /**
   * Retorna a cor do bot
   */
  getColor(): Color {
    return this.color;
  }
}
