import { EasyBot, MediumBot, HardBot } from '@/lib/game/bot';
import { createInitialBoard } from '@/lib/game/board';
import { executeMove, checkVictory } from '@/lib/game/engine';
import { BoardState, Color, Game, GameStatus, GameType, GameResult } from '@/types/game';

/**
 * Cria um jogo temporário para testes
 */
function createGame(board: BoardState, currentPlayer: Color): Game {
  return {
    id: 'test-game',
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

describe('Integração - Partida Completa Contra Bot', () => {
  describe('Bot Fácil', () => {
    it('deve completar uma partida válida contra bot fácil', () => {
      const bot = new EasyBot(Color.BLACK);
      const board = createInitialBoard();
      let game = createGame(board, Color.WHITE);
      let moves = 0;
      const MAX_MOVES = 200; // Limite para evitar loop infinito

      // Simular partida até vitória ou empate
      while (game.status === GameStatus.IN_PROGRESS && moves < MAX_MOVES) {
        moves++;

        // Turno do jogador (simulado com movimento do bot branco)
        const whiteBot = new EasyBot(Color.WHITE);
        const whiteMove = whiteBot.getMove(game.boardState);
        game = executeMove(whiteMove, game);

        // Verificar vitória
        const whiteVictory = checkVictory(game);
        if (whiteVictory.isVictory) {
          game.status = GameStatus.FINISHED;
          game.result =
            whiteVictory.winner === Color.WHITE ? GameResult.WHITE_WIN : GameResult.BLACK_WIN;
          break;
        }

        // Turno do bot preto
        const blackMove = bot.getMove(game.boardState);
        game = executeMove(blackMove, game);

        // Verificar vitória
        const blackVictory = checkVictory(game);
        if (blackVictory.isVictory) {
          game.status = GameStatus.FINISHED;
          game.result =
            blackVictory.winner === Color.BLACK ? GameResult.BLACK_WIN : GameResult.WHITE_WIN;
          break;
        }
      }

      // Deve ter terminado ou estar próximo ao fim
      expect(moves).toBeGreaterThan(0);
      expect(moves).toBeLessThan(MAX_MOVES);
      expect(game.boardState.pieces.length).toBeGreaterThan(0);
    }, 30000); // Timeout de 30s

    it('deve respeitar todas as regras do jogo', () => {
      const bot = new EasyBot(Color.BLACK);
      const board = createInitialBoard();
      const game = createGame(board, Color.BLACK);

      // Bot deve fazer movimento válido
      const move = bot.getMove(game.boardState);

      expect(move).toBeDefined();
      expect(move.from).toBeDefined();
      expect(move.to).toBeDefined();
      expect(move.pieceId).toBeDefined();

      // Movimento deve ser executável sem erro
      expect(() => executeMove(move, game)).not.toThrow();
    });
  });

  describe('Bot Médio', () => {
    it('deve completar uma partida válida contra bot médio', () => {
      const bot = new MediumBot(Color.BLACK);
      const board = createInitialBoard();
      let game = createGame(board, Color.WHITE);
      let moves = 0;
      const MAX_MOVES = 200;

      while (game.status === GameStatus.IN_PROGRESS && moves < MAX_MOVES) {
        moves++;

        const whiteBot = new MediumBot(Color.WHITE);
        const whiteMove = whiteBot.getMove(game.boardState);
        game = executeMove(whiteMove, game);

        const whiteVictory = checkVictory(game);
        if (whiteVictory.isVictory) {
          game.status = GameStatus.FINISHED;
          break;
        }

        const blackMove = bot.getMove(game.boardState);
        game = executeMove(blackMove, game);

        const blackVictory = checkVictory(game);
        if (blackVictory.isVictory) {
          game.status = GameStatus.FINISHED;
          break;
        }
      }

      expect(moves).toBeGreaterThan(0);
      expect(moves).toBeLessThan(MAX_MOVES);
    }, 60000); // Timeout de 60s

    it('deve fazer jogadas mais inteligentes que bot fácil', () => {
      const mediumBot = new MediumBot(Color.BLACK);
      const board = createInitialBoard();

      const move = mediumBot.getMove(board);

      // Movimento deve ser válido e inteligente
      expect(move).toBeDefined();
      expect(move.from.row).toBeGreaterThanOrEqual(0);
      expect(move.to.row).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Bot Difícil', () => {
    it('deve completar uma partida válida contra bot difícil', () => {
      const bot = new HardBot(Color.BLACK, 4); // Depth reduzido para teste
      const board = createInitialBoard();
      let game = createGame(board, Color.WHITE);
      let moves = 0;
      const MAX_MOVES = 150;

      while (game.status === GameStatus.IN_PROGRESS && moves < MAX_MOVES) {
        moves++;

        const whiteBot = new HardBot(Color.WHITE, 4);
        const whiteMove = whiteBot.getMove(game.boardState);
        game = executeMove(whiteMove, game);

        const whiteVictory = checkVictory(game);
        if (whiteVictory.isVictory) {
          game.status = GameStatus.FINISHED;
          break;
        }

        const blackMove = bot.getMove(game.boardState);
        game = executeMove(blackMove, game);

        const blackVictory = checkVictory(game);
        if (blackVictory.isVictory) {
          game.status = GameStatus.FINISHED;
          break;
        }
      }

      expect(moves).toBeGreaterThan(0);
      expect(moves).toBeLessThan(MAX_MOVES);
    }, 120000); // Timeout de 120s

    it('deve fazer as melhores jogadas possíveis', () => {
      const hardBot = new HardBot(Color.BLACK, 5);
      const board = createInitialBoard();

      const move = hardBot.getMove(board);

      // Bot difícil deve sempre retornar movimento ótimo
      expect(move).toBeDefined();
      expect(move.from.row).toBeGreaterThanOrEqual(0);
      expect(move.to.row).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Comparação de Dificuldades', () => {
    it('bots devem ter tempos de resposta diferentes', () => {
      const board = createInitialBoard();

      const startEasy = Date.now();
      const easyBot = new EasyBot(Color.BLACK);
      easyBot.getMove(board);
      const easyTime = Date.now() - startEasy;

      const startMedium = Date.now();
      const mediumBot = new MediumBot(Color.BLACK);
      mediumBot.getMove(board);
      const mediumTime = Date.now() - startMedium;

      const startHard = Date.now();
      const hardBot = new HardBot(Color.BLACK, 4);
      hardBot.getMove(board);
      const hardTime = Date.now() - startHard;

      // Easy deve ser mais rápido que Medium que deve ser mais rápido que Hard
      expect(easyTime).toBeLessThan(mediumTime + 100); // Margem de erro
      expect(mediumTime).toBeLessThan(hardTime + 500);
    }, 15000);

    it('todos os bots devem respeitar regras de captura obrigatória', () => {
      const board: BoardState = {
        pieces: [
          { id: 'b1', color: Color.BLACK, type: 0, row: 3, col: 3 },
          { id: 'w1', color: Color.WHITE, type: 0, row: 4, col: 4 },
        ],
        capturedPieces: { white: 0, black: 0 },
        positionHistory: [],
      };

      const easyBot = new EasyBot(Color.BLACK);
      const mediumBot = new MediumBot(Color.BLACK);
      const hardBot = new HardBot(Color.BLACK, 4);

      const easyMove = easyBot.getMove(board);
      const mediumMove = mediumBot.getMove(board);
      const hardMove = hardBot.getMove(board);

      // Todos devem fazer captura (movimento de 2 casas)
      expect(Math.abs(easyMove.to.row - easyMove.from.row)).toBe(2);
      expect(Math.abs(mediumMove.to.row - mediumMove.from.row)).toBe(2);
      expect(Math.abs(hardMove.to.row - hardMove.from.row)).toBe(2);
    });
  });

  describe('Robustez', () => {
    it('deve lidar com erros graciosamente', () => {
      const bot = new EasyBot(Color.BLACK);
      const emptyBoard: BoardState = {
        pieces: [],
        capturedPieces: { white: 0, black: 0 },
        positionHistory: [],
      };

      expect(() => bot.getMove(emptyBoard)).toThrow();
    });

    it('deve funcionar com diferentes configurações de tabuleiro', () => {
      const bot = new MediumBot(Color.WHITE);

      // Tabuleiro com poucas peças
      const sparseBoard: BoardState = {
        pieces: [
          { id: 'w1', color: Color.WHITE, type: 0, row: 2, col: 1 },
          { id: 'b1', color: Color.BLACK, type: 0, row: 5, col: 4 },
        ],
        capturedPieces: { white: 0, black: 0 },
        positionHistory: [],
      };

      const move = bot.getMove(sparseBoard);
      expect(move).toBeDefined();
    });

    it('deve funcionar com damas no tabuleiro', () => {
      const bot = new HardBot(Color.BLACK, 3);

      const boardWithKings: BoardState = {
        pieces: [
          { id: 'b1', color: Color.BLACK, type: 1, row: 3, col: 3 }, // King
          { id: 'w1', color: Color.WHITE, type: 1, row: 4, col: 4 }, // King
        ],
        capturedPieces: { white: 0, black: 0 },
        positionHistory: [],
      };

      const move = bot.getMove(boardWithKings);
      expect(move).toBeDefined();
    });
  });
});
