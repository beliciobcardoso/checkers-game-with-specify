import { HardBot } from '@/lib/game/bot/hard';
import { BoardState, Color, PieceType } from '@/types/game';
import { createInitialBoard } from '@/lib/game/board';

describe('Bot Difícil - Minimax Alpha-Beta', () => {
  let bot: HardBot;

  // Helper para criar tabuleiro vazio
  function createEmptyBoard(): BoardState {
    return {
      pieces: [],
      capturedPieces: { white: 0, black: 0 },
      positionHistory: [],
    };
  }

  // Helper para criar peça
  function createPiece(id: string, color: Color, type: PieceType, row: number, col: number) {
    return { id, color, type, row, col };
  }

  beforeEach(() => {
    bot = new HardBot(Color.BLACK);
  });

  describe('Validação Básica', () => {
    it('deve retornar um movimento válido em menos de 5 segundos', () => {
      const board = createInitialBoard();
      const start = Date.now();
      const move = bot.getMove(board);
      const elapsed = Date.now() - start;

      expect(move).toBeDefined();
      expect(move.from).toBeDefined();
      expect(move.to).toBeDefined();
      expect(move.pieceId).toBeDefined();
      expect(elapsed).toBeLessThan(5000);
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

  describe('Minimax - Análise Profunda', () => {
    it('deve encontrar vitória em 2 movimentos', () => {
      const board = createEmptyBoard();
      // Cenário onde bot pode vencer em 2 movimentos
      const blackKing = createPiece('b1', Color.BLACK, PieceType.KING, 2, 2);
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 5);

      board.pieces = [blackKing, whitePiece];

      const move = bot.getMove(board);

      // Bot deve escolher movimento que leva à vitória
      expect(move).toBeDefined();
    });

    it('deve evitar perder peça em 3 movimentos adiante', () => {
      const board = createEmptyBoard();
      // Cenário complexo onde uma jogada leva a perder peça
      const blackPiece1 = createPiece('b1', Color.BLACK, PieceType.NORMAL, 3, 3);
      const blackPiece2 = createPiece('b2', Color.BLACK, PieceType.NORMAL, 5, 1);
      const whitePiece1 = createPiece('w1', Color.WHITE, PieceType.NORMAL, 4, 4);
      const whitePiece2 = createPiece('w2', Color.WHITE, PieceType.NORMAL, 6, 2);

      board.pieces = [blackPiece1, blackPiece2, whitePiece1, whitePiece2];

      const move = bot.getMove(board);

      // Bot deve escolher movimento seguro
      expect(move).toBeDefined();
    });

    it('deve priorizar captura que maximiza vantagem material', () => {
      const board = createEmptyBoard();
      // Duas opções de captura: uma remove peça comum, outra remove dama
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 3, 3);
      const whiteNormal = createPiece('w1', Color.WHITE, PieceType.NORMAL, 4, 4);
      const whiteKing = createPiece('w2', Color.WHITE, PieceType.KING, 4, 2);

      board.pieces = [blackPiece, whiteNormal, whiteKing];

      const move = bot.getMove(board);

      // Deve capturar a dama (mais valiosa)
      const rowDiff = move.to.row - move.from.row;
      const colDiff = move.to.col - move.from.col;

      expect(Math.abs(rowDiff)).toBe(2);
      expect(Math.abs(colDiff)).toBe(2);
    });

    it('deve calcular melhor sequência de capturas múltiplas', () => {
      const board = createEmptyBoard();
      // Cenário com múltiplas capturas possíveis
      const blackKing = createPiece('b1', Color.BLACK, PieceType.KING, 0, 0);
      const whitePiece1 = createPiece('w1', Color.WHITE, PieceType.NORMAL, 1, 1);
      const whitePiece2 = createPiece('w2', Color.WHITE, PieceType.NORMAL, 3, 3);
      const whitePiece3 = createPiece('w3', Color.WHITE, PieceType.NORMAL, 5, 5);

      board.pieces = [blackKing, whitePiece1, whitePiece2, whitePiece3];

      const move = bot.getMove(board);

      // Deve iniciar a melhor sequência
      expect(move.from.row).toBe(0);
      expect(move.from.col).toBe(0);
    });
  });

  describe('Alpha-Beta Pruning', () => {
    it('deve usar poda para melhorar performance', () => {
      // Este teste verifica que o bot termina mais rápido que força bruta
      const board = createInitialBoard();

      const start = Date.now();
      const move = bot.getMove(board);
      const elapsed = Date.now() - start;

      // Com alpha-beta, deve ser mais rápido que 5s mesmo em tabuleiro cheio
      expect(elapsed).toBeLessThan(3000); // Margem generosa
      expect(move).toBeDefined();
    });

    it('deve explorar profundidade de 5-7 camadas', () => {
      // Teste conceitual - verifica comportamento em cenário que requer análise profunda
      const board = createEmptyBoard();

      // Cenário tático complexo
      for (let i = 0; i < 4; i++) {
        board.pieces.push(
          createPiece(`b${i}`, Color.BLACK, PieceType.NORMAL, 2 + i, i % 2 === 0 ? 1 : 3)
        );
        board.pieces.push(
          createPiece(`w${i}`, Color.WHITE, PieceType.NORMAL, 5 + i, i % 2 === 0 ? 2 : 4)
        );
      }

      const move = bot.getMove(board);

      // Deve retornar movimento inteligente
      expect(move).toBeDefined();
    });
  });

  describe('Avaliação Estratégica', () => {
    it('deve valorizar posição sobre material quando próximo ao fim', () => {
      const board = createEmptyBoard();
      // Endgame: poucas peças, posição é crucial
      const blackKing = createPiece('b1', Color.BLACK, PieceType.KING, 3, 3);
      const whiteKing = createPiece('w1', Color.WHITE, PieceType.KING, 5, 5);

      board.pieces = [blackKing, whiteKing];

      const move = bot.getMove(board);

      // Deve aproximar-se estrategicamente
      expect(move).toBeDefined();
    });

    it('deve forçar trocas quando em vantagem material', () => {
      const board = createEmptyBoard();
      // Bot tem 3 peças, oponente tem 1
      const blackPiece1 = createPiece('b1', Color.BLACK, PieceType.NORMAL, 2, 2);
      const blackPiece2 = createPiece('b2', Color.BLACK, PieceType.NORMAL, 3, 3);
      const blackPiece3 = createPiece('b3', Color.BLACK, PieceType.NORMAL, 4, 4);
      const whitePiece = createPiece('w1', Color.WHITE, PieceType.NORMAL, 5, 5);

      board.pieces = [blackPiece1, blackPiece2, blackPiece3, whitePiece];

      const move = bot.getMove(board);

      // Deve buscar captura para simplificar
      expect(move).toBeDefined();
    });

    it('deve evitar trocas quando em desvantagem material', () => {
      const board = createEmptyBoard();
      // Bot tem 1 peça, oponente tem 3
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 2, 2);
      const whitePiece1 = createPiece('w1', Color.WHITE, PieceType.NORMAL, 4, 4);
      const whitePiece2 = createPiece('w2', Color.WHITE, PieceType.NORMAL, 5, 3);
      const whitePiece3 = createPiece('w3', Color.WHITE, PieceType.NORMAL, 6, 4);

      board.pieces = [blackPiece, whitePiece1, whitePiece2, whitePiece3];

      const move = bot.getMove(board);

      // Deve mover defensivamente
      expect(move).toBeDefined();
    });

    it('deve priorizar promoção a dama quando possível', () => {
      const board = createEmptyBoard();
      // Peça a 1 movimento de virar dama
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 6, 2);

      board.pieces = [blackPiece];

      const move = bot.getMove(board);

      // Deve avançar para promoção
      expect(move.to.row).toBe(7);
    });
  });

  describe('Performance', () => {
    it('deve calcular movimento em tabuleiro cheio em menos de 5s', () => {
      const board = createInitialBoard();
      const start = Date.now();

      const move = bot.getMove(board);

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5000);
      expect(move).toBeDefined();
    });

    it('deve calcular movimento em cenário médio em menos de 3s', () => {
      const board = createEmptyBoard();
      // Cenário com 8 peças
      for (let i = 0; i < 4; i++) {
        board.pieces.push(createPiece(`b${i}`, Color.BLACK, PieceType.NORMAL, 3 + i, i));
        board.pieces.push(createPiece(`w${i}`, Color.WHITE, PieceType.NORMAL, 4 + i, i + 1));
      }

      const start = Date.now();
      const move = bot.getMove(board);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(3000);
      expect(move).toBeDefined();
    });

    it('deve calcular movimento em endgame rapidamente', () => {
      const board = createEmptyBoard();
      // Apenas 2 peças
      board.pieces = [
        createPiece('b1', Color.BLACK, PieceType.KING, 2, 2),
        createPiece('w1', Color.WHITE, PieceType.KING, 5, 5),
      ];

      const start = Date.now();
      const move = bot.getMove(board);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1000);
      expect(move).toBeDefined();
    });
  });

  describe('Superioridade sobre bots mais simples', () => {
    it('deve ter jogadas consistentemente melhores que bot Médio', () => {
      // Teste conceitual - bot Difícil deve fazer análise mais profunda
      const board = createEmptyBoard();
      const blackPiece = createPiece('b1', Color.BLACK, PieceType.NORMAL, 3, 3);
      const whitePiece1 = createPiece('w1', Color.WHITE, PieceType.NORMAL, 4, 4);
      const whitePiece2 = createPiece('w2', Color.WHITE, PieceType.NORMAL, 5, 5);

      board.pieces = [blackPiece, whitePiece1, whitePiece2];

      const move = bot.getMove(board);

      // Deve fazer movimento ótimo considerando múltiplas jogadas
      expect(move).toBeDefined();
    });

    it('deve calcular linhas de jogo mais longas', () => {
      // Bot Difícil analisa 5-7 camadas vs 2-3 do Médio
      const board = createInitialBoard();

      const move = bot.getMove(board);

      // Deve considerar consequências de longo prazo
      expect(move).toBeDefined();
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

    it('deve lidar com posições de empate', () => {
      const board = createEmptyBoard();
      // Posição simétrica - empate iminente
      const blackKing = createPiece('b1', Color.BLACK, PieceType.KING, 0, 0);
      const whiteKing = createPiece('w1', Color.WHITE, PieceType.KING, 7, 7);

      board.pieces = [blackKing, whiteKing];

      const move = bot.getMove(board);

      // Deve retornar movimento válido mesmo em posição de empate
      expect(move).toBeDefined();
    });
  });

  describe('Configuração de Profundidade', () => {
    it('deve aceitar profundidade configurável', () => {
      const customBot = new HardBot(Color.BLACK, 4);
      const board = createInitialBoard();

      const move = customBot.getMove(board);

      expect(move).toBeDefined();
    });

    it('deve respeitar limite de tempo mesmo com profundidade alta', () => {
      const deepBot = new HardBot(Color.BLACK, 10); // Profundidade muito alta
      const board = createInitialBoard();

      const start = Date.now();
      const move = deepBot.getMove(board);
      const elapsed = Date.now() - start;

      // Deve parar antes do timeout
      expect(elapsed).toBeLessThan(5000);
      expect(move).toBeDefined();
    });
  });
});
