/**
 * T111: useWebSocket Hook
 *
 * Manages Socket.IO connection for online games.
 * Handles connection, reconnection, and event subscriptions.
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

interface UseWebSocketReturn {
  socket: Socket | null;
  status: ConnectionStatus;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || '', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      logger.info('WebSocket connected', { socketId: newSocket.id });
      setStatus('connected');
    });

    newSocket.on('disconnect', (reason) => {
      logger.info('WebSocket disconnected', { reason });
      setStatus('disconnected');
    });

    newSocket.on('reconnect_attempt', () => {
      logger.info('WebSocket reconnecting...');
      setStatus('reconnecting');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      logger.info('WebSocket reconnected', { attemptNumber });
      setStatus('connected');
    });

    newSocket.on('reconnect_failed', () => {
      logger.error('WebSocket reconnection failed');
      setStatus('disconnected');
    });

    newSocket.on('error', (error) => {
      logger.error('WebSocket error', { error });
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      logger.warn('Cannot emit event: socket not connected', { event });
    }
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  }, []);

  return {
    socket,
    status,
    emit,
    on,
    off,
  };
}
