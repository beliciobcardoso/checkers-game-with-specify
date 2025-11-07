/**
 * T073: GameHistoryTable Component
 * Exibe histórico de partidas do jogador com paginação
 *
 * Props: games[], total, page, limit, onPageChange
 * Display: Tabela com adversário, resultado, data, botão ver detalhes
 * Features: Paginação, formatação de datas, badges de resultado
 */

'use client';

interface Game {
  id: string;
  type: string;
  result: 'WIN' | 'LOSS' | 'DRAW';
  opponent?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface GameHistoryTableProps {
  games: Game[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export default function GameHistoryTable({
  games,
  total,
  page,
  limit,
  onPageChange,
}: GameHistoryTableProps) {
  const totalPages = Math.ceil(total / limit);

  // Formata data
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Badge de resultado
  const getResultBadge = (result: string) => {
    const styles = {
      WIN: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      LOSS: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      DRAW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    };

    const labels = {
      WIN: 'Vitória',
      LOSS: 'Derrota',
      DRAW: 'Empate',
    };

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${styles[result as keyof typeof styles]}`}
      >
        {labels[result as keyof typeof labels]}
      </span>
    );
  };

  // Tipo de partida badge
  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      LOCAL: 'Local',
      ONLINE: 'Online',
      BOT: 'Bot',
    };

    return (
      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        {labels[type] || type}
      </span>
    );
  };

  if (games.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Histórico de Partidas
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">Nenhuma partida encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Histórico de Partidas
      </h2>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                Tipo
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                Adversário
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                Resultado
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                Data
              </th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr
                key={game.id}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="py-3 px-4">{getTypeBadge(game.type)}</td>
                <td className="py-3 px-4 text-gray-900 dark:text-white">
                  {game.opponent || 'Anônimo'}
                </td>
                <td className="py-3 px-4">{getResultBadge(game.result)}</td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(game.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total} partidas
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            >
              Anterior
            </button>

            <div className="flex items-center gap-2 px-4 text-gray-700 dark:text-gray-300">
              Página {page} de {totalPages}
            </div>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
