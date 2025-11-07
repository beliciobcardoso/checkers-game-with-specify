import { Color, BoardState, Move } from '@/types/game';
import { EasyBot } from './easy';
import { MediumBot } from './medium';
import { HardBot } from './hard';

/**
 * Tipos de dificuldade disponíveis
 */
export type BotDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

/**
 * Interface para bot genérico
 */
export interface Bot {
  getMove(board: BoardState): Move;
  getColor(): Color;
}

/**
 * Factory para criar bots baseado na dificuldade
 *
 * @example
 * ```typescript
 * const bot = createBot('MEDIUM', Color.BLACK);
 * const move = bot.getMove(boardState);
 * ```
 */
export function createBot(difficulty: BotDifficulty, color: Color): Bot {
  switch (difficulty) {
    case 'EASY':
      return new EasyBot(color);

    case 'MEDIUM':
      return new MediumBot(color);

    case 'HARD':
      return new HardBot(color);

    default:
      throw new Error(`Unknown bot difficulty: ${difficulty}`);
  }
}

/**
 * Informações sobre cada dificuldade
 */
export const BOT_DIFFICULTY_INFO = {
  EASY: {
    label: 'Fácil',
    description: 'Movimentos aleatórios com preferência por capturas',
    icon: '🎲',
    color: 'green',
  },
  MEDIUM: {
    label: 'Médio',
    description: 'Analisa 2-3 jogadas adiante com estratégia básica',
    icon: '🧠',
    color: 'yellow',
  },
  HARD: {
    label: 'Difícil',
    description: 'Algoritmo minimax avançado, análise profunda',
    icon: '🎯',
    color: 'red',
  },
} as const;

/**
 * Valida se uma string é uma dificuldade válida
 */
export function isValidDifficulty(difficulty: string): difficulty is BotDifficulty {
  return ['EASY', 'MEDIUM', 'HARD'].includes(difficulty);
}

/**
 * Obtém informações sobre uma dificuldade
 */
export function getDifficultyInfo(difficulty: BotDifficulty) {
  return BOT_DIFFICULTY_INFO[difficulty];
}

/**
 * Lista todas as dificuldades disponíveis
 */
export function getAllDifficulties(): BotDifficulty[] {
  return ['EASY', 'MEDIUM', 'HARD'];
}
