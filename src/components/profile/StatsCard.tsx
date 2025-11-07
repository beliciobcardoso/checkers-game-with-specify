/**
 * T072: StatsCard Component
 * Exibe estatísticas do jogador
 *
 * Props: stats { totalGames, wins, losses, draws, winRate }
 * Display: Cards com números grandes e labels, winRate formatada como porcentagem
 */

'use client';

interface Stats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

interface StatsCardProps {
  stats: Stats;
}

export default function StatsCard({ stats }: StatsCardProps) {
  // Formata winRate como porcentagem
  const winRatePercent = (stats.winRate * 100).toFixed(1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Estatísticas</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total de Partidas */}
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalGames}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total</p>
        </div>

        {/* Vitórias */}
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.wins}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Vitórias</p>
        </div>

        {/* Derrotas */}
        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.losses}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Derrotas</p>
        </div>

        {/* Empates */}
        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.draws}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Empates</p>
        </div>

        {/* Taxa de Vitória */}
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {winRatePercent}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Taxa de Vitória</p>
        </div>
      </div>

      {/* Informação adicional se não houver partidas */}
      {stats.totalGames === 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Você ainda não jogou nenhuma partida. Que tal começar agora?
          </p>
        </div>
      )}
    </div>
  );
}
