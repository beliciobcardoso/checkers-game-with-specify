/**
 * T109: ConnectionStatus Component
 *
 * Displays real-time connection status indicator.
 * Shows connected, disconnected, or reconnecting states.
 */

'use client';

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'reconnecting';
  className?: string;
}

export function ConnectionStatus({ status, className = '' }: ConnectionStatusProps) {
  const statusConfig = {
    connected: {
      icon: '🟢',
      text: 'Conectado',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    disconnected: {
      icon: '🔴',
      text: 'Desconectado',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
    },
    reconnecting: {
      icon: '🟡',
      text: 'Reconectando...',
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${className}`}
    >
      <span className="text-sm">{config.icon}</span>
      <span className={`text-xs font-medium ${config.color}`}>{config.text}</span>
      {status === 'reconnecting' && (
        <span className="flex gap-0.5">
          <span
            className="w-1 h-1 bg-current rounded-full animate-bounce"
            style={{ animationDelay: '0s' }}
          ></span>
          <span
            className="w-1 h-1 bg-current rounded-full animate-bounce"
            style={{ animationDelay: '0.2s' }}
          ></span>
          <span
            className="w-1 h-1 bg-current rounded-full animate-bounce"
            style={{ animationDelay: '0.4s' }}
          ></span>
        </span>
      )}
    </div>
  );
}
