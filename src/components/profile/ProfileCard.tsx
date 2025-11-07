/**
 * T071: ProfileCard Component
 * Exibe informações do perfil do jogador
 *
 * Props: player { id, username, email, createdAt }
 * Display: username, email, data de cadastro formatada
 */

'use client';

interface Player {
  id: string;
  username: string;
  email: string;
  createdAt: Date | string;
}

interface ProfileCardProps {
  player: Player;
}

export default function ProfileCard({ player }: ProfileCardProps) {
  // Formata data de cadastro
  const createdDate = new Date(player.createdAt);
  const formattedDate = createdDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Perfil</h2>

      <div className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Nome de usuário
          </label>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{player.username}</p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Email
          </label>
          <p className="text-lg text-gray-900 dark:text-white">{player.email}</p>
        </div>

        {/* Member Since */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Membro desde
          </label>
          <p className="text-lg text-gray-900 dark:text-white">{formattedDate}</p>
        </div>

        {/* Player ID (pequeno, discreto) */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">ID: {player.id}</p>
        </div>
      </div>
    </div>
  );
}
