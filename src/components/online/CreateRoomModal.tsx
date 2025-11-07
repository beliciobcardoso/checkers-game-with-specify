/**
 * T105: CreateRoomModal Component
 *
 * Modal for creating a new online multiplayer room.
 * Displays room code after creation for sharing with opponent.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated?: (roomCode: string) => void;
}

export function CreateRoomModal({ isOpen, onClose, onRoomCreated }: CreateRoomModalProps) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar sala');
      }

      setRoomCode(result.data.code);
      onRoomCreated?.(result.data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sala');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
    }
  };

  const handleReset = () => {
    setRoomCode(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 bg-white dark:bg-gray-800">
        <h2 className="text-2xl font-bold mb-4">Criar Sala Online</h2>

        {!roomCode ? (
          <>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Crie uma sala e compartilhe o código com seu oponente para começar a jogar.
            </p>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleCreateRoom} disabled={loading} className="flex-1">
                {loading ? 'Criando...' : 'Criar Sala'}
              </Button>
              <Button onClick={onClose} variant="secondary">
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded mb-6">
              <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                ✓ Sala criada com sucesso!
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mb-4">
                Compartilhe este código com seu oponente:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white dark:bg-gray-900 text-2xl font-mono font-bold text-center py-3 px-4 rounded">
                  {roomCode}
                </code>
                <Button onClick={handleCopyCode} size="sm">
                  Copiar
                </Button>
              </div>
            </div>

            <Button onClick={handleReset} className="w-full">
              Fechar
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
