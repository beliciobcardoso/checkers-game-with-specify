import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { WS_EVENTS } from '@/lib/constants';
import { createLogger } from '@/lib/logger';

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
      socket.on(WS_EVENTS.CREATE_ROOM, (data) =>
        this.handleCreateRoom(socket, data),
      );
      socket.on(WS_EVENTS.JOIN_ROOM, (data) =>
        this.handleJoinRoom(socket, data),
      );
      socket.on(WS_EVENTS.LEAVE_ROOM, (data) =>
        this.handleLeaveRoom(socket, data),
      );

      // Game flow
      socket.on(WS_EVENTS.GAME_MOVE, (data) => this.handleGameMove(socket, data));
      socket.on(WS_EVENTS.PLAYER_READY, (data) =>
        this.handlePlayerReady(socket, data),
      );
      socket.on(WS_EVENTS.GAME_ABANDON, (data) =>
        this.handleGameAbandon(socket, data),
      );

      // Disconnection
      socket.on(WS_EVENTS.DISCONNECT, () => {
        logger.info(`Client disconnected: ${socket.id}`);
        this.handleDisconnect(socket);
      });
    });
  }

  private handleCreateRoom(socket: Socket, _data: unknown) {
    // TODO: Implement in Phase 5
    logger.debug('Create room', socket.id);
  }

  private handleJoinRoom(socket: Socket, _data: unknown) {
    // TODO: Implement in Phase 5
    logger.debug('Join room', socket.id);
  }

  private handleLeaveRoom(socket: Socket, _data: unknown) {
    // TODO: Implement in Phase 5
    logger.debug('Leave room', socket.id);
  }

  private handleGameMove(socket: Socket, _data: unknown) {
    // TODO: Implement in Phase 5
    logger.debug('Game move', socket.id);
  }

  private handlePlayerReady(socket: Socket, _data: unknown) {
    // TODO: Implement in Phase 5
    logger.debug('Player ready', socket.id);
  }

  private handleGameAbandon(socket: Socket, _data: unknown) {
    // TODO: Implement in Phase 5
    logger.debug('Game abandon', socket.id);
  }

  private handleDisconnect(socket: Socket) {
    // TODO: Implement reconnection logic in Phase 5
    logger.debug('Handle disconnect', socket.id);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default WebSocketServer;
