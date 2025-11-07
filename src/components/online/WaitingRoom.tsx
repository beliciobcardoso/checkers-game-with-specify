/**
 * T107: WaitingRoom Component
 *
 * Displays waiting state while waiting for second player to join.
 * Shows room code for sharing and provides copy functionality.
 */

'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface WaitingRoomProps {
  roomCode: string;
  hostUsername?: string;
  onCopyCode?: () => void;
  onCancel?: () => void;
}

export function WaitingRoom({ roomCode, hostUsername, onCopyCode, onCancel }: WaitingRoomProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    onCopyCode?.();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-8 text-center">
      <div className="mb-6">
        <div className="animate-pulse text-6xl mb-4">⏳</div>
        <h2 className="text-3xl font-bold mb-2">Aguardando Oponente</h2>
        <p className="text-gray-600 dark:text-gray-300">
          {hostUsername
            ? `${hostUsername} está aguardando um oponente`
            : 'Aguardando segundo jogador entrar na sala'}
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-6">
        <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
          Compartilhe este código com seu oponente:
        </p>
        <div className="flex items-center justify-center gap-3 mb-4">
          <code className="bg-white dark:bg-gray-900 text-4xl font-mono font-bold py-4 px-8 rounded-lg shadow-sm">
            {roomCode}
          </code>
        </div>
        <Button onClick={handleCopy} size="sm" variant="secondary">
          📋 Copiar Código
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex gap-1">
            <span
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: '0s' }}
            ></span>
            <span
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: '0.2s' }}
            ></span>
            <span
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: '0.4s' }}
            ></span>
          </div>
          <span>Esperando conexão...</span>
        </div>

        {onCancel && (
          <Button onClick={onCancel} variant="secondary" size="sm">
            Cancelar e Voltar
          </Button>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold mb-3">Como jogar:</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 text-left max-w-md mx-auto">
          <li>• Peças brancas sempre começam o jogo</li>
          <li>• Capturas são obrigatórias quando disponíveis</li>
          <li>• Peças viram damas ao alcançar a última linha</li>
          <li>• Você tem 5 minutos para reconectar em caso de queda</li>
        </ul>
      </div>
    </Card>
  );
}
