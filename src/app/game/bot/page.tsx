'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DifficultySelector from '@/components/bot/DifficultySelector';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BotDifficulty } from '@/lib/game/bot/factory';
import { Color } from '@/types/game';

export default function BotGamePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [difficulty, setDifficulty] = useState<BotDifficulty>('EASY');
  const [playerColor, setPlayerColor] = useState<Color>(Color.WHITE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartGame = async () => {
    if (!session?.user?.id) {
      setError('Você precisa estar autenticado para jogar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'BOT',
          botDifficulty: difficulty,
          playerColor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao criar jogo');
      }

      const data = await response.json();
      router.push(`/game/bot/play/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar jogo');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Autenticação Necessária</h2>
          <p className="mb-4">Você precisa estar autenticado para jogar contra o bot.</p>
          <Button onClick={() => router.push('/login')}>Fazer Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Jogar Contra Bot</h1>

        <Card className="p-8 mb-6">
          <DifficultySelector
            selectedDifficulty={difficulty}
            onSelect={setDifficulty}
            disabled={loading}
          />
        </Card>

        <Card className="p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Escolha sua Cor</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPlayerColor(Color.WHITE)}
              disabled={loading}
              className={`p-4 rounded-lg border-2 transition-all ${
                playerColor === Color.WHITE
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-blue-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-white border-4 border-gray-800"></div>
                <span className="font-medium">Brancas</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">(Você começa)</span>
              </div>
            </button>

            <button
              onClick={() => setPlayerColor(Color.BLACK)}
              disabled={loading}
              className={`p-4 rounded-lg border-2 transition-all ${
                playerColor === Color.BLACK
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-blue-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-gray-800 border-4 border-white"></div>
                <span className="font-medium">Pretas</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">(Bot começa)</span>
              </div>
            </button>
          </div>
        </Card>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <Button onClick={handleStartGame} disabled={loading} className="px-8 py-4 text-lg">
            {loading ? 'Criando jogo...' : 'Iniciar Partida'}
          </Button>
        </div>

        <div className="mt-8 text-center">
          <Button variant="secondary" onClick={() => router.push('/')} disabled={loading}>
            Voltar ao Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
