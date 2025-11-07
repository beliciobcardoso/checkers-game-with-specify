import {
  createBot,
  isValidDifficulty,
  getDifficultyInfo,
  getAllDifficulties,
  BOT_DIFFICULTY_INFO,
  type BotDifficulty,
} from '@/lib/game/bot/factory';
import { EasyBot } from '@/lib/game/bot/easy';
import { MediumBot } from '@/lib/game/bot/medium';
import { HardBot } from '@/lib/game/bot/hard';
import { Color } from '@/types/game';

describe('Bot Factory', () => {
  describe('createBot', () => {
    it('deve criar bot fácil', () => {
      const bot = createBot('EASY', Color.BLACK);
      expect(bot).toBeInstanceOf(EasyBot);
      expect(bot.getColor()).toBe(Color.BLACK);
    });

    it('deve criar bot médio', () => {
      const bot = createBot('MEDIUM', Color.WHITE);
      expect(bot).toBeInstanceOf(MediumBot);
      expect(bot.getColor()).toBe(Color.WHITE);
    });

    it('deve criar bot difícil', () => {
      const bot = createBot('HARD', Color.BLACK);
      expect(bot).toBeInstanceOf(HardBot);
      expect(bot.getColor()).toBe(Color.BLACK);
    });

    it('deve lançar erro para dificuldade inválida', () => {
      expect(() => createBot('INVALID' as BotDifficulty, Color.BLACK)).toThrow(
        'Unknown bot difficulty: INVALID'
      );
    });

    it('deve criar bots com cores diferentes', () => {
      const blackBot = createBot('EASY', Color.BLACK);
      const whiteBot = createBot('EASY', Color.WHITE);

      expect(blackBot.getColor()).toBe(Color.BLACK);
      expect(whiteBot.getColor()).toBe(Color.WHITE);
    });
  });

  describe('isValidDifficulty', () => {
    it('deve validar dificuldades válidas', () => {
      expect(isValidDifficulty('EASY')).toBe(true);
      expect(isValidDifficulty('MEDIUM')).toBe(true);
      expect(isValidDifficulty('HARD')).toBe(true);
    });

    it('deve rejeitar dificuldades inválidas', () => {
      expect(isValidDifficulty('easy')).toBe(false);
      expect(isValidDifficulty('INVALID')).toBe(false);
      expect(isValidDifficulty('')).toBe(false);
      expect(isValidDifficulty('normal')).toBe(false);
    });
  });

  describe('getDifficultyInfo', () => {
    it('deve retornar informações do bot fácil', () => {
      const info = getDifficultyInfo('EASY');
      expect(info.label).toBe('Fácil');
      expect(info.description).toContain('aleatórios');
      expect(info.icon).toBe('🎲');
      expect(info.color).toBe('green');
    });

    it('deve retornar informações do bot médio', () => {
      const info = getDifficultyInfo('MEDIUM');
      expect(info.label).toBe('Médio');
      expect(info.description).toContain('2-3 jogadas');
      expect(info.icon).toBe('🧠');
      expect(info.color).toBe('yellow');
    });

    it('deve retornar informações do bot difícil', () => {
      const info = getDifficultyInfo('HARD');
      expect(info.label).toBe('Difícil');
      expect(info.description).toContain('minimax');
      expect(info.icon).toBe('🎯');
      expect(info.color).toBe('red');
    });
  });

  describe('getAllDifficulties', () => {
    it('deve retornar todas as dificuldades', () => {
      const difficulties = getAllDifficulties();
      expect(difficulties).toEqual(['EASY', 'MEDIUM', 'HARD']);
      expect(difficulties).toHaveLength(3);
    });

    it('deve retornar array imutável', () => {
      const difficulties1 = getAllDifficulties();
      const difficulties2 = getAllDifficulties();
      expect(difficulties1).toEqual(difficulties2);
    });
  });

  describe('BOT_DIFFICULTY_INFO', () => {
    it('deve conter informações para todas as dificuldades', () => {
      expect(BOT_DIFFICULTY_INFO.EASY).toBeDefined();
      expect(BOT_DIFFICULTY_INFO.MEDIUM).toBeDefined();
      expect(BOT_DIFFICULTY_INFO.HARD).toBeDefined();
    });

    it('deve ter estrutura consistente para todas as dificuldades', () => {
      const difficulties: BotDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

      difficulties.forEach((difficulty) => {
        const info = BOT_DIFFICULTY_INFO[difficulty];
        expect(info.label).toBeDefined();
        expect(info.description).toBeDefined();
        expect(info.icon).toBeDefined();
        expect(info.color).toBeDefined();
      });
    });
  });

  describe('Integração', () => {
    it('deve criar bots funcionais de todas as dificuldades', () => {
      const difficulties: BotDifficulty[] = ['EASY', 'MEDIUM', 'HARD'];

      difficulties.forEach((difficulty) => {
        const bot = createBot(difficulty, Color.BLACK);
        expect(bot).toBeDefined();
        expect(bot.getColor()).toBe(Color.BLACK);
        expect(typeof bot.getMove).toBe('function');
      });
    });

    it('deve permitir iteração sobre todas as dificuldades', () => {
      const bots = getAllDifficulties().map((difficulty) => ({
        difficulty,
        bot: createBot(difficulty, Color.WHITE),
        info: getDifficultyInfo(difficulty),
      }));

      expect(bots).toHaveLength(3);
      bots.forEach((item) => {
        expect(item.bot.getColor()).toBe(Color.WHITE);
        expect(item.info.label).toBeDefined();
      });
    });

    it('deve validar e criar bot em sequência', () => {
      const difficulty = 'MEDIUM';

      if (isValidDifficulty(difficulty)) {
        const bot = createBot(difficulty, Color.BLACK);
        const info = getDifficultyInfo(difficulty);

        expect(bot).toBeInstanceOf(MediumBot);
        expect(info.label).toBe('Médio');
      }
    });
  });
});
