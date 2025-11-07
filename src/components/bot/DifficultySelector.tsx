'use client';

import { useState } from 'react';
import { BotDifficulty, BOT_DIFFICULTY_INFO } from '@/lib/game/bot/factory';
import { Card } from '@/components/ui/Card';

interface DifficultyOption {
  value: BotDifficulty;
  label: string;
  description: string;
  icon: string;
  color: string;
}

interface DifficultySelectorProps {
  selectedDifficulty?: BotDifficulty;
  onSelect: (difficulty: BotDifficulty) => void;
  disabled?: boolean;
}

export default function DifficultySelector({
  selectedDifficulty,
  onSelect,
  disabled = false,
}: DifficultySelectorProps) {
  const [selected, setSelected] = useState<BotDifficulty>(selectedDifficulty || 'EASY');

  const difficulties: DifficultyOption[] = [
    {
      value: 'EASY',
      ...BOT_DIFFICULTY_INFO.EASY,
    },
    {
      value: 'MEDIUM',
      ...BOT_DIFFICULTY_INFO.MEDIUM,
    },
    {
      value: 'HARD',
      ...BOT_DIFFICULTY_INFO.HARD,
    },
  ];

  const handleSelect = (difficulty: BotDifficulty) => {
    setSelected(difficulty);
    onSelect(difficulty);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center mb-6">Escolha a Dificuldade</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {difficulties.map((diff) => (
          <Card
            key={diff.value}
            className={`cursor-pointer transition-all ${
              selected === diff.value
                ? `ring-2 ring-${diff.color} bg-${diff.color}/10`
                : 'hover:shadow-lg'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && handleSelect(diff.value)}
          >
            <div className="p-6 text-center">
              <div className="text-4xl mb-4">{diff.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{diff.label}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{diff.description}</p>

              {selected === diff.value && (
                <div className="mt-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium bg-${diff.color} text-white`}
                  >
                    Selecionado
                  </span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h4 className="font-semibold mb-2">Sobre as Dificuldades:</h4>
        <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
          <li>
            <strong>Fácil:</strong> Ideal para iniciantes. O bot faz movimentos aleatórios, mas
            válidos.
          </li>
          <li>
            <strong>Médio:</strong> O bot pensa 2-3 jogadas à frente e usa estratégias básicas.
          </li>
          <li>
            <strong>Difícil:</strong> Desafiador! O bot usa algoritmo minimax com profundidade 5-7.
          </li>
        </ul>
      </div>
    </div>
  );
}
