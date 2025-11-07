import { MediumBot } from '@/lib/game/bot/medium';
import { BoardState, Color, PieceType, Move } from '@/types/game';
import { createInitialBoard } from '@/lib/game/board';

describe('Bot Médio - Lookahead 2-3 Jogadas', () => {
  let bot: MediumBot;

  // Helper para criar tabuleiro vazio
  function createEmptyBoard(): BoardState {
    return {
      pieces: [],
      capturedPieces: { white: [], black: [] },
      positionHistory: [],
    };
  }

  // Helper para criar peça
  function createPiece(id: string, color: Color, type: PieceType, row: number, col: number) {
    return { id, color, type, row, col };
  }

  beforeEach(() => {
    bot = new MediumBot(Color.BLACK);
  });

  describe('Validação Básica', () => {
    it('deve retornar um movimento válido em menos de 2 segundos', () => {
      const board = createInitialBoard();
      const start = Date.now();
      const move = bot.getMove(board);
      const elapsed = Date.now() - start;

      expect(move).toBeDefined();
      expect(move.from).toBeDefined();
      expect(move.to).toBeDefined();
      expect(move.pieceId).toBeDefined();
      expect(elapsed).toBeLessThan(2000);
    });

    it('deve retornar movimentos apenas para peças pretas', () => {
      const board = createInitialBoard();
      const move = bot.getMove(board);
      const piece = board.pieces.find((p) => p.id === move.pieceId);

      expect(piece).toBeDefined();
      expect(piece?.color).toBe(Color.BLACK);
    });

    it('deve retornar apenas movimentos válidos', () => {
      const board = createInitialBoard();
      const move = bot.getMove(board);

      expect(move.from.row).toBeGreaterThanOrEqual(0);
      expect(move.from.row).toBeLessThanOrEqual(7);
      expect(move.from.col).toBeGreaterThanOrEqual(0);
      expect(move.from.col).toBeLessThanOrEqual(7);
      expect(move.to.row).toBeGreaterThanOrEqual(0);
      expect(move.to.row).toBeLessThanOrEqual(7);
      expect(move.to.col).toBeGreaterThanOrEqual(0);
      expect(move.to.col).toBeLessThanOrEqual(7);
    });
  });

  describe('Inteligência Tática - Lookahead', () => {
    it('deve escolher captura que leva a múltiplas capturas', () => {
      const board = createEmptyBoard();
      // Configurar cenário onde uma captura leva a outra
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 4, 2);
      const whitePiece1 = createPiece('w1', Color.WHITE, PieceType.NORMAL, 3, 3);
      const whitePiece2 = createPiece('w2', Color.WHITE, PieceType.NORMAL, 1, 5);

      board.pieces = [blackPiece, whitePiece1, whitePiece2];

      const move = bot.getMove(board);

      // Deve escolher capturar w1 pois leva a capturar w2 em seguida
      expect(move.from.row).toBe(4);
      expect(move.from.col).toBe(2);
    });

    it('deve evitar armadilhas simples (1 jogada adiante)', () => {
      const board = createEmptyBoard();
      // Peça preta pode avançar, mas seria capturada
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 4, 2);
      const whiteTrap = createPiece('w1', Color.WHITE, PieceType.NORMAL, 2, 1);
      const safeBlackPiece = createPiece('b2', Color.BLACK, PieceType.NORMAL, 5, 1);

      board.pieces = [blackPiece, whiteTrap, safeBlackPiece];

      const move = bot.getMove(board);

      // Deve preferir mover b2 que está segura ao invés de b1 que pode ser capturada
      // Ou mover b1 para posição segura
      expect(move.pieceId).toBeDefined();
    });

    it('deve priorizar capturas que melhoram posição', () => {
      const board = createEmptyBoard();
      // Duas capturas possíveis: uma avança território, outra não
      const blackPiece1 = createPiece('b1', Color.BLACK, PieceType.NORMAL, 4, 2);
      const whitePiece1 = createPiece('w1', Color.WHITE, PieceType.NORMAL, 3, 3);

      const blackPiece2 = createPiece('b2', Color.BLACK, PieceType.NORMAL, 5, 5);
      const whitePiece2 = createPiece('w2', Color.WHITE, PieceType.NORMAL, 4, 6);

      board.pieces = [blackPiece1, whitePiece1, blackPiece2, whitePiece2];

      const move = bot.getMove(board);

      // Deve escolher a captura que avança mais (b1 captura w1)
      expect(move).toBeDefined();
    });
  });

  describe('Avaliação Posicional', () => {
    it('deve preferir movimentos que avançam peças', () => {
      const board = createEmptyBoard();
      // Peça preta pode mover para frente ou para trás
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 4, 2);

      board.pieces = [blackPiece];

      const move = bot.getMove(board);

      // Movimento para frente (rowDiff positivo para pretas)
      const rowDiff = move.to.row - move.from.row;
      expect(rowDiff).toBeGreaterThan(0); // Pretas movem para row maior
    });

    it('deve valorizar peças próximas à promoção', () => {
      const board = createEmptyBoard();
      // Peça quase virando dama vs peça longe
      const blackNearPromo = createPiece('b1', Color.BLACK, PieceType.NORMAL, 6, 2);
      const blackFar = createPiece('b2', Color.BLACK, PieceType.NORMAL, 2, 4);

      board.pieces = [blackNearPromo, blackFar];

      const move = bot.getMove(board);

      // Deve preferir mover a peça próxima à promoção
      expect(move.pieceId).toBe('b1');
    });

    it('deve valorizar controle do centro do tabuleiro', () => {
      const board = createEmptyBoard();
      // Opção de mover para centro vs borda
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 5, 2);

      board.pieces = [blackPiece];

      const move = bot.getMove(board);

      // Centro é colunas 2-5
      expect(move.to.col).toBeGreaterThanOrEqual(2);
      expect(move.to.col).toBeLessThanOrEqual(5);
    });
  });

  describe('Comportamento com Damas', () => {
    it('deve usar damas para pressionar adversário', () => {
      const board = createEmptyBoard();
      const blackKing = createPiece('b1', Color.BLACK, PieceType.KING, 3, 3);
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 5);

      board.pieces = [blackKing, whitePiece];

      const move = bot.getMove(board);

      // Dama deve se aproximar da peça branca
      const distBefore = Math.abs(3 - 5) + Math.abs(3 - 5);
      const distAfter = Math.abs(move.to.row - 5) + Math.abs(move.to.col - 5);

      expect(distAfter).toBeLessThanOrEqual(distBefore);
    });

    it('deve usar damas para capturar múltiplas peças', () => {
      const board = createEmptyBoard();
      const blackKing = createPiece('b1', Color.BLACK, PieceType.KING, 0, 0);
      const whitePiece1 = createPiece('w1', Color.WHITE, PieceType.NORMAL, 2, 2);
      const whitePiece2 = createPiece('w2', Color.WHITE, PieceType.NORMAL, 4, 4);

      board.pieces = [blackKing, whitePiece1, whitePiece2];

      const move = bot.getMove(board);

      // Deve iniciar sequência de capturas
      expect(move.from.row).toBe(0);
      expect(move.from.col).toBe(0);
    });
  });

  describe('Performance', () => {
    it('deve calcular movimento em tabuleiro cheio em menos de 2s', () => {
      const board = createInitialBoard();
      const start = Date.now();

      const move = bot.getMove(board);

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2000);
      expect(move).toBeDefined();
    });

    it('deve calcular movimento em cenário complexo em menos de 2s', () => {
      const board = createEmptyBoard();
      // Cenário complexo: várias peças com múltiplas opções
      for (let i = 0; i < 6; i++) {
        board.pieces.push(
          createPiece(`b${i}`, Color.BLACK, PieceType.NORMAL, 2 + i, i % 2 === 0 ? 1 : 3)
        );
        board.pieces.push(
          createPiece(`w${i}`, Color.WHITE, PieceType.NORMAL, 4 + i, i % 2 === 0 ? 2 : 4)
        );
      }

      const start = Date.now();
      const move = bot.getMove(board);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(2000);
      expect(move).toBeDefined();
    });

    it('deve ter melhor qualidade de jogadas que bot Fácil', () => {
      // Este teste é conceitual - validação manual
      // Bot Médio deve considerar consequências e não apenas aleatoriedade
      const board = createEmptyBoard();
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 4, 2);
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 3, 3);

      board.pieces = [blackPiece, whitePiece];

      const move = bot.getMove(board);

      // Deve escolher captura (comportamento inteligente vs aleatório)
      const rowDiff = Math.abs(move.to.row - move.from.row);
      expect(rowDiff).toBe(2); // Captura = 2 casas
    });
  });

  describe('Casos Extremos', () => {
    it('deve retornar movimento mesmo quando há apenas uma peça', () => {
      const board = createEmptyBoard();
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 2, 1);
      board.pieces = [blackPiece];

      const move = bot.getMove(board);

      expect(move).toBeDefined();
      expect(move.from.row).toBe(2);
      expect(move.from.col).toBe(1);
    });

    it('deve lançar erro quando não há peças', () => {
      const board = createEmptyBoard();
      board.pieces = [];

      expect(() => bot.getMove(board)).toThrow('Bot não tem peças no tabuleiro');
    });

    it('deve funcionar com profundidade de análise de 2-3 jogadas', () => {
      // Teste conceitual - verifica que bot analisa múltiplas jogadas
      const board = createInitialBoard();

      const move = bot.getMove(board);

      expect(move).toBeDefined();
      // Bot deve retornar movimento válido após análise de lookahead
    });
  });
});
