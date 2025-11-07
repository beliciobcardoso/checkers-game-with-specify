import { BotService } from '@/services/BotService';
import { prisma } from '@/lib/prisma';
import { Color, GameType, GameStatus, GameResult } from '@/types/game';
import { createInitialBoard } from '@/lib/game/board';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    game: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('BotService', () => {
  let botService: BotService;
  const mockPlayerId = 'player-123';

  beforeEach(() => {
    botService = new BotService();
    jest.clearAllMocks();
  });

  describe('startBotGame', () => {
    it('deve criar jogo contra bot com jogador como brancas', async () => {
      const mockGame = {
        id: 'game-123',
        type: GameType.BOT,
        status: GameStatus.IN_PROGRESS,
        botDifficulty: 'EASY',
        whitePlayerId: mockPlayerId,
        blackPlayerId: null,
        boardState: {},
        currentTurn: Color.WHITE,
        moveCount: 0,
      };

      (prisma.game.create as jest.Mock).mockResolvedValue(mockGame);

      const result = await botService.startBotGame(mockPlayerId, 'EASY', Color.WHITE);

      expect(prisma.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: GameType.BOT,
          status: GameStatus.IN_PROGRESS,
          botDifficulty: 'EASY',
          whitePlayerId: mockPlayerId,
          blackPlayerId: null,
          currentTurn: Color.WHITE,
          moveCount: 0,
        }),
      });

      expect(result.id).toBe('game-123');
      expect(result.type).toBe(GameType.BOT);
      expect(result.boardState).toBeDefined();
    });

    it('deve criar jogo contra bot com jogador como pretas', async () => {
      const mockGame = {
        id: 'game-456',
        type: GameType.BOT,
        status: GameStatus.IN_PROGRESS,
        botDifficulty: 'MEDIUM',
        whitePlayerId: null,
        blackPlayerId: mockPlayerId,
        boardState: {},
        currentTurn: Color.WHITE,
        moveCount: 0,
      };

      (prisma.game.create as jest.Mock).mockResolvedValue(mockGame);

      const result = await botService.startBotGame(mockPlayerId, 'MEDIUM', Color.BLACK);

      expect(prisma.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          whitePlayerId: null,
          blackPlayerId: mockPlayerId,
        }),
      });

      expect(result.blackPlayerId).toBe(mockPlayerId);
    });

    it('deve usar brancas como cor padrão se não especificado', async () => {
      const mockGame = {
        id: 'game-789',
        type: GameType.BOT,
        status: GameStatus.IN_PROGRESS,
        botDifficulty: 'HARD',
        whitePlayerId: mockPlayerId,
        blackPlayerId: null,
        boardState: {},
        currentTurn: Color.WHITE,
        moveCount: 0,
      };

      (prisma.game.create as jest.Mock).mockResolvedValue(mockGame);

      const result = await botService.startBotGame(mockPlayerId, 'HARD');

      expect(result.whitePlayerId).toBe(mockPlayerId);
    });

    it('deve lançar erro se falhar ao criar jogo', async () => {
      (prisma.game.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(botService.startBotGame(mockPlayerId, 'EASY')).rejects.toThrow(
        'Failed to start bot game'
      );
    });
  });

  describe('executeBotMove', () => {
    it('deve executar movimento do bot e atualizar jogo', async () => {
      const mockGame = {
        id: 'game-123',
        type: GameType.BOT,
        status: GameStatus.IN_PROGRESS,
        botDifficulty: 'EASY',
        whitePlayerId: mockPlayerId,
        blackPlayerId: null,
        boardState: createInitialBoard(),
        currentTurn: Color.BLACK, // Turno do bot
        moveCount: 1,
      };

      (prisma.game.update as jest.Mock).mockResolvedValue({
        ...mockGame,
        moveCount: 2,
        currentTurn: Color.WHITE,
      });

      const result = await botService.executeBotMove(mockGame);

      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: 'game-123' },
        data: expect.objectContaining({
          moveCount: expect.any(Number),
          currentTurn: expect.any(String),
        }),
      });

      expect(result.moveCount).toBeGreaterThan(mockGame.moveCount);
    });

    it('deve lançar erro se jogo não for contra bot', async () => {
      const mockGame = {
        id: 'game-123',
        type: GameType.LOCAL,
        status: GameStatus.IN_PROGRESS,
        boardState: createInitialBoard(),
        currentTurn: Color.WHITE,
        moveCount: 0,
      };

      await expect(botService.executeBotMove(mockGame as any)).rejects.toThrow(
        'Game is not a bot game'
      );
    });

    it('deve lançar erro se dificuldade do bot não estiver definida', async () => {
      const mockGame = {
        id: 'game-123',
        type: GameType.BOT,
        status: GameStatus.IN_PROGRESS,
        boardState: createInitialBoard(),
        currentTurn: Color.WHITE,
        moveCount: 0,
      };

      await expect(botService.executeBotMove(mockGame as any)).rejects.toThrow(
        'Bot difficulty not set'
      );
    });

    it('deve lançar erro se não for turno do bot', async () => {
      const mockGame = {
        id: 'game-123',
        type: GameType.BOT,
        status: GameStatus.IN_PROGRESS,
        botDifficulty: 'EASY',
        whitePlayerId: mockPlayerId,
        blackPlayerId: null,
        boardState: createInitialBoard(),
        currentTurn: Color.WHITE, // Turno do jogador
        moveCount: 0,
      };

      await expect(botService.executeBotMove(mockGame)).rejects.toThrow('Not bot turn');
    });
  });

  describe('recordGameResult', () => {
    it('deve registrar resultado de vitória do jogador', async () => {
      (prisma.game.update as jest.Mock).mockResolvedValue({
        id: 'game-123',
        status: GameStatus.FINISHED,
        result: GameResult.WHITE_WIN,
      });

      await botService.recordGameResult('game-123', {
        winner: Color.WHITE,
        reason: 'Todas as peças adversárias capturadas',
      });

      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: 'game-123' },
        data: expect.objectContaining({
          status: GameStatus.FINISHED,
          result: expect.any(Object),
        }),
      });
    });

    it('deve registrar resultado de empate', async () => {
      (prisma.game.update as jest.Mock).mockResolvedValue({
        id: 'game-123',
        status: GameStatus.FINISHED,
        result: GameResult.DRAW,
      });

      await botService.recordGameResult('game-123', {
        reason: 'Repetição de posição',
      });

      expect(prisma.game.update).toHaveBeenCalledWith({
        where: { id: 'game-123' },
        data: expect.objectContaining({
          status: GameStatus.FINISHED,
          result: expect.any(Object),
        }),
      });
    });

    it('deve lançar erro se falhar ao registrar resultado', async () => {
      (prisma.game.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        botService.recordGameResult('game-123', {
          winner: Color.WHITE,
        })
      ).rejects.toThrow('Failed to record game result');
    });
  });

  describe('getBotColor', () => {
    it('deve retornar BLACK se jogador for WHITE', () => {
      const game = {
        whitePlayerId: mockPlayerId,
        blackPlayerId: null,
      } as any;

      const result = (botService as any).getBotColor(game);
      expect(result).toBe(Color.BLACK);
    });

    it('deve retornar WHITE se jogador for BLACK', () => {
      const game = {
        whitePlayerId: null,
        blackPlayerId: mockPlayerId,
      } as any;

      const result = (botService as any).getBotColor(game);
      expect(result).toBe(Color.WHITE);
    });
  });

  describe('isBotTurn', () => {
    it('deve retornar true se for turno do bot', () => {
      const game = {
        type: GameType.BOT,
        whitePlayerId: mockPlayerId,
        blackPlayerId: null,
        currentTurn: Color.BLACK, // Bot
      } as any;

      const result = botService.isBotTurn(game);
      expect(result).toBe(true);
    });

    it('deve retornar false se for turno do jogador', () => {
      const game = {
        type: GameType.BOT,
        whitePlayerId: mockPlayerId,
        blackPlayerId: null,
        currentTurn: Color.WHITE, // Jogador
      } as any;

      const result = botService.isBotTurn(game);
      expect(result).toBe(false);
    });
  });

  describe('getBotInfo', () => {
    it('deve retornar informações do bot se for jogo contra bot', () => {
      const game = {
        type: GameType.BOT,
        botDifficulty: 'MEDIUM',
        whitePlayerId: null,
        blackPlayerId: mockPlayerId,
      } as any;

      const result = botService.getBotInfo(game);

      expect(result).toEqual({
        difficulty: 'MEDIUM',
        color: Color.WHITE,
      });
    });

    it('deve retornar null se não for jogo contra bot', () => {
      const game = {
        type: GameType.LOCAL,
      } as any;

      const result = botService.getBotInfo(game);
      expect(result).toBeNull();
    });

    it('deve retornar null se dificuldade não estiver definida', () => {
      const game = {
        type: GameType.BOT,
        whitePlayerId: mockPlayerId,
      } as any;

      const result = botService.getBotInfo(game);
      expect(result).toBeNull();
    });
  });
});
