import { Game, GameType, Color, GameStatus, GameResult } from '@/types/game';
import { createBot, BotDifficulty } from '@/lib/game/bot';
import { executeMove, checkVictory, checkDraw } from '@/lib/game/engine';
import { createInitialBoard } from '@/lib/game/board';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { serializeBoardState } from '@/lib/utils/boardState';
import { playerService } from './PlayerService';

/**
 * Service para gerenciar partidas contra bot
 */
export class BotService {
  /**
   * Inicia uma nova partida contra bot
   * @param playerId ID do jogador humano
   * @param difficulty Dificuldade do bot
   * @param playerColor Cor escolhida pelo jogador (WHITE ou BLACK)
   * @returns Jogo criado
   */
  async startBotGame(
    playerId: string,
    difficulty: BotDifficulty,
    playerColor: Color = Color.WHITE
  ): Promise<Game> {
    try {
      logger.info('Starting bot game', { playerId, difficulty, playerColor });

      const initialBoard = createInitialBoard();

      // Criar jogo no banco de dados
      const game = await prisma.game.create({
        data: {
          type: GameType.BOT,
          status: GameStatus.IN_PROGRESS,
          botDifficulty: difficulty,
          whitePlayerId: playerColor === Color.WHITE ? playerId : null,
          blackPlayerId: playerColor === Color.BLACK ? playerId : null,
          boardState: serializeBoardState(initialBoard),
          currentTurn: Color.WHITE,
          moveCount: 0,
        },
      });

      logger.info('Bot game created', { gameId: game.id });

      return {
        ...game,
        boardState: initialBoard,
      } as Game;
    } catch (error) {
      logger.error('Error starting bot game', { error, playerId, difficulty });
      throw new Error('Failed to start bot game');
    }
  }

  /**
   * Executa o turno do bot
   * @param game Jogo atual
   * @returns Jogo atualizado após movimento do bot
   */
  async executeBotMove(game: Game): Promise<Game> {
    try {
      if (game.type !== GameType.BOT) {
        throw new Error('Game is not a bot game');
      }

      if (!game.botDifficulty) {
        throw new Error('Bot difficulty not set');
      }

      // Determinar cor do bot
      const botColor = this.getBotColor(game);

      // Verificar se é turno do bot
      if (game.currentTurn !== botColor) {
        throw new Error('Not bot turn');
      }

      logger.info('Executing bot move', {
        gameId: game.id,
        botColor,
        difficulty: game.botDifficulty,
      });

      // Criar bot
      const bot = createBot(game.botDifficulty, botColor);

      // Calcular movimento
      const startTime = Date.now();
      const move = bot.getMove(game.boardState);
      const elapsedTime = Date.now() - startTime;

      logger.info('Bot move calculated', {
        gameId: game.id,
        move,
        elapsedTime,
      });

      // Executar movimento
      const updatedGame = executeMove(move, game);

      // Check for victory or draw
      const victoryCheck = checkVictory(updatedGame);
      const drawCheck = checkDraw(updatedGame);

      let newStatus = game.status;
      let newResult = game.result;

      if (victoryCheck.isVictory) {
        newStatus = GameStatus.FINISHED;
        newResult =
          victoryCheck.winner === Color.WHITE ? GameResult.WHITE_WIN : GameResult.BLACK_WIN;
      } else if (drawCheck.isDraw) {
        newStatus = GameStatus.FINISHED;
        newResult = GameResult.DRAW;
      }

      // Salvar jogo atualizado
      await prisma.game.update({
        where: { id: game.id },
        data: {
          boardState: serializeBoardState(updatedGame.boardState),
          currentTurn: updatedGame.currentTurn,
          moveCount: updatedGame.moveCount,
          status: newStatus,
          result: newResult,
        },
      });

      // If game ended, record player statistics
      if (newStatus === GameStatus.FINISHED && newResult) {
        await this.recordBotGameStatistics(game, newResult);
      }

      logger.info('Bot move executed', { gameId: game.id, newStatus, newResult });

      return {
        ...updatedGame,
        status: newStatus,
        result: newResult,
      };
    } catch (error) {
      logger.error('Error executing bot move', { error, gameId: game.id });
      throw error;
    }
  }

  /**
   * Registra o resultado da partida
   * @param gameId ID do jogo
   * @param result Resultado final
   */
  async recordGameResult(gameId: string, result: Game['result']): Promise<void> {
    try {
      await prisma.game.update({
        where: { id: gameId },
        data: {
          result,
          status: GameStatus.FINISHED,
        },
      });

      logger.info('Bot game result recorded', { gameId, result });
    } catch (error) {
      logger.error('Error recording bot game result', { error, gameId });
      throw new Error('Failed to record game result');
    }
  }

  /**
   * Determina a cor do bot baseado no jogo
   */
  private getBotColor(game: Game): Color {
    // Se há jogador branco, bot é preto
    if (game.whitePlayerId) {
      return Color.BLACK;
    }
    // Se há jogador preto, bot é branco
    if (game.blackPlayerId) {
      return Color.WHITE;
    }
    // Não deveria acontecer
    throw new Error('No player assigned to game');
  }

  /**
   * Verifica se é turno do bot
   */
  isBotTurn(game: Game): boolean {
    if (game.type !== GameType.BOT) {
      return false;
    }

    const botColor = this.getBotColor(game);
    return game.currentTurn === botColor;
  }

  /**
   * Obtém informações sobre o bot do jogo
   */
  getBotInfo(game: Game) {
    if (game.type !== GameType.BOT || !game.botDifficulty) {
      return null;
    }

    return {
      difficulty: game.botDifficulty,
      color: this.getBotColor(game),
    };
  }

  /**
   * Registra estatísticas do jogador após partida contra bot
   * @param game Jogo finalizado
   * @param result Resultado final
   */
  private async recordBotGameStatistics(game: Game, result: GameResult): Promise<void> {
    try {
      // Determinar qual jogador é humano
      const humanPlayerId = game.whitePlayerId || game.blackPlayerId;

      if (!humanPlayerId) {
        logger.warn('No human player found in bot game', { gameId: game.id });
        return;
      }

      // Determinar cor do jogador humano
      const humanColor = game.whitePlayerId ? Color.WHITE : Color.BLACK;

      // Determinar resultado para o jogador humano
      let playerResult: 'WIN' | 'LOSS' | 'DRAW';

      if (result === GameResult.DRAW) {
        playerResult = 'DRAW';
      } else if (
        (result === GameResult.WHITE_WIN && humanColor === Color.WHITE) ||
        (result === GameResult.BLACK_WIN && humanColor === Color.BLACK)
      ) {
        playerResult = 'WIN';
      } else {
        playerResult = 'LOSS';
      }

      // Registrar resultado com tipo BOT
      await playerService.recordGameResult(humanPlayerId, playerResult, 'BOT');

      logger.info('Bot game statistics recorded', {
        gameId: game.id,
        playerId: humanPlayerId,
        result: playerResult,
        botDifficulty: game.botDifficulty,
      });
    } catch (error) {
      logger.error('Failed to record bot game statistics', {
        error,
        gameId: game.id,
      });
      // Don't throw - statistics update failure shouldn't break game flow
    }
  }
}

// Instância singleton
export const botService = new BotService();
