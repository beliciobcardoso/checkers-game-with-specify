/**
 * T076: Profile Page
 * Página de perfil com ProfileCard, StatsCard, GameHistoryTable
 * 
 * Route: /profile
 * Features: Server-side data fetching, authenticated route
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileCard from '@/components/profile/ProfileCard';
import StatsCard from '@/components/profile/StatsCard';
import GameHistoryTable from '@/components/profile/GameHistoryTable';

interface Player {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

interface Stats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

interface Game {
  id: string;
  type: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  opponent?: string;
  createdAt: string;
  updatedAt: string;
}

interface HistoryData {
  games: Game[];
  total: number;
  page: number;
  limit: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<HistoryData>({
    games: [],
    total: 0,
    page: 1,
    limit: 20,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Carrega dados do perfil
  useEffect(() => {
    loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Carrega dados do player
      const playerRes = await fetch('/api/players/me');
      if (!playerRes.ok) {
        if (playerRes.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Erro ao carregar perfil');
      }
      const playerData = await playerRes.json();
      setPlayer(playerData.player);

      // Carrega estatísticas
      const statsRes = await fetch('/api/players/me/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // Carrega histórico
      loadHistory(1);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async (page: number) => {
    try {
      const historyRes = await fetch(`/api/players/me/history?page=${page}&limit=20`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  };

  const handlePageChange = (newPage: number) => {
    loadHistory(newPage);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !player || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || 'Erro ao carregar perfil'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header com botão de logout */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Meu Perfil
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Voltar
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Card - ocupa 1 coluna */}
          <div className="lg:col-span-1">
            <ProfileCard player={player} />
          </div>

          {/* Stats Card - ocupa 2 colunas */}
          <div className="lg:col-span-2">
            <StatsCard stats={stats} />
          </div>
        </div>

        {/* Histórico de partidas - largura completa */}
        <GameHistoryTable
          games={history.games}
          total={history.total}
          page={history.page}
          limit={history.limit}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
