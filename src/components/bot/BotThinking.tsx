'use client';

import { BotDifficulty, getDifficultyInfo } from '@/lib/game/bot/factory';

interface BotThinkingProps {
  difficulty?: BotDifficulty;
  message?: string;
}

export default function BotThinking({
  difficulty,
  message = 'Bot está pensando...',
}: BotThinkingProps) {
  const difficultyInfo = difficulty ? getDifficultyInfo(difficulty) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-6">
          {/* Animated Spinner */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>

            {/* Icon in center */}
            {difficultyInfo && (
              <div className="absolute inset-0 flex items-center justify-center text-3xl">
                {difficultyInfo.icon}
              </div>
            )}
          </div>

          {/* Message */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{message}</h3>

            {difficultyInfo && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nível: <span className="font-medium">{difficultyInfo.label}</span>
              </p>
            )}
          </div>

          {/* Animated dots */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
          </div>

          {/* Tip */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-500 max-w-xs">
            O bot está calculando o melhor movimento possível...
          </p>
        </div>
      </div>
    </div>
  );
}
