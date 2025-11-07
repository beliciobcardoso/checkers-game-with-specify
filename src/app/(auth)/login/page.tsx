/**
 * T074: Login Page
 * Página de login com LoginForm
 *
 * Route: /login
 * Layout: (auth) group para páginas de autenticação
 */

import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Login - Jogo de Damas',
  description: 'Faça login para jogar damas online',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Jogo de Damas</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Entrar</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Entre para jogar damas online com outros jogadores
          </p>
        </div>

        {/* Login Form */}
        <LoginForm />
      </div>
    </div>
  );
}
