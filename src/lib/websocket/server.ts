import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { WS_EVENTS } from '@/lib/constants';
import { createLogger } from '@/lib/logger';
import { handleJoinRoom } from './handlers/joinRoom';
import { handleMakeMove } from './handlers/makeMove';
import { handleDisconnect } from './handlers/disconnect';
import { handleReconnect } from './handlers/reconnect';
import { handleResign } from './handlers/resign';

const logger = createLogger('WebSocket');

export class WebSocketServer {
  private io: SocketIOServer;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on(WS_EVENTS.CONNECT, (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Room management
      socket.on(WS_EVENTS.JOIN_ROOM, (data) => handleJoinRoom(socket, data));
      socket.on(WS_EVENTS.LEAVE_ROOM, (data) => this.handleLeaveRoom(socket, data));

      // Game flow
      socket.on(WS_EVENTS.GAME_MOVE, (data) => handleMakeMove(socket, data));
      socket.on('reconnect-game', (data) => handleReconnect(socket, data));
      socket.on('resign-game', (data) => handleResign(socket, data));

      // Disconnection
      socket.on(WS_EVENTS.DISCONNECT, () => {
        logger.info(`Client disconnected: ${socket.id}`);
        handleDisconnect(socket);
      });
    });
  }

  private handleLeaveRoom(socket: Socket, _data: unknown) {
    // TODO: Implement room leave logic
    logger.debug('Leave room', socket.id);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default WebSocketServer;
