/**
 * T106: JoinRoomModal Component
 *
 * Modal for joining an existing room by code.
 * Validates code format and handles join errors.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinRoom = async () => {
    if (!roomCode || roomCode.length !== 6) {
      setError('Código deve ter 6 caracteres');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${roomCode.toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao entrar na sala');
      }

      // Navigate to waiting room or game
      if (result.data.status === 'WAITING') {
        router.push(`/game/online/room/${roomCode.toUpperCase()}`);
      } else if (result.data.status === 'ACTIVE' && result.data.gameId) {
        router.push(`/game/online/play/${result.data.gameId}`);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar na sala');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    setRoomCode(value);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && roomCode.length === 6) {
      handleJoinRoom();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 bg-white dark:bg-gray-800">
        <h2 className="text-2xl font-bold mb-4">Entrar em Sala</h2>

        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Digite o código de 6 caracteres da sala que você deseja entrar.
        </p>

        <div className="mb-6">
          <Input
            type="text"
            value={roomCode}
            onChange={handleCodeChange}
            onKeyPress={handleKeyPress}
            placeholder="ABC123"
            maxLength={6}
            className="text-center text-2xl font-mono font-bold tracking-widest"
            autoFocus
          />
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleJoinRoom}
            disabled={loading || roomCode.length !== 6}
            className="flex-1"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
          <Button onClick={onClose} variant="secondary">
            Cancelar
          </Button>
        </div>
      </Card>
    </div>
  );
}
