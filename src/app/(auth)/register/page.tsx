/**
 * T075: Register Page
 * Página de registro com RegisterForm
 * 
 * Route: /register
 * Layout: (auth) group para páginas de autenticação
 */

import RegisterForm from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Criar Conta - Jogo de Damas',
  description: 'Crie uma conta para jogar damas online',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Jogo de Damas
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            Criar Conta
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Crie sua conta gratuitamente e comece a jogar
          </p>
        </div>

        {/* Register Form */}
        <RegisterForm />
      </div>
    </div>
  );
}
