# WebSocket Events Specification

**Feature**: Jogo de Damas Multiplayer  
**Protocol**: Socket.io 4.x  
**Transport**: WebSocket (fallback to HTTP long-polling)

## Overview

WebSocket communication para sincronização em tempo real de partidas online. Eventos bidirecionais entre cliente e servidor para movimentos, reconexões, e notificações de estado.

---

## Connection

### Handshake

**Client Initiates**:

```typescript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3000', {
  auth: {
    sessionToken: getCookie('next-auth.session-token'),
  },
  transports: ['websocket', 'polling'], // Fallback
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});
```

**Server Response**:

```typescript
io.on('connection', (socket) => {
  const session = await validateSession(socket.handshake.auth.sessionToken);
  if (!session) {
    socket.disconnect();
    return;
  }

  socket.data.playerId = session.userId;
  console.log(`Player ${session.userId} connected`);
});
```

---

## Events

### 1. join-room

Client joins game room by code.

**Direction**: Client → Server

**Payload**:

```typescript
{
  roomCode: string; // 6-character alphanumeric
}
```

**Example**:

```typescript
socket.emit('join-room', { roomCode: 'ABC123' });
```

**Server Response Events**:

- `room-joined` (success)
- `error` (room not found/full)

---

### 2. room-joined

Confirmation that player joined room.

**Direction**: Server → Client (broadcasted to room)

**Payload**:

```typescript
{
  room: {
    id: string;
    code: string;
    status: 'WAITING' | 'ACTIVE';
    players: {
      white: { id: string; username: string } | null;
      black: { id: string; username: string } | null;
    };
  };
  game: {
    id: string;
    boardState: BoardState;
    currentTurn: 'WHITE' | 'BLACK';
  } | null; // null if waiting for second player
}
```

**Example**:

```typescript
socket.on('room-joined', (data) => {
  console.log(`Joined room ${data.room.code}`);
  if (data.game) {
    initializeBoard(data.game.boardState);
  }
});
```

---

### 3. player-joined

Notification when second player joins room.

**Direction**: Server → Clients (broadcasted to room)

**Payload**:

```typescript
{
  player: {
    id: string;
    username: string;
    color: 'WHITE' | 'BLACK';
  }
  game: {
    id: string;
    boardState: BoardState;
    currentTurn: 'WHITE';
    status: 'IN_PROGRESS';
  }
}
```

**Example**:

```typescript
socket.on('player-joined', (data) => {
  console.log(`${data.player.username} joined as ${data.player.color}`);
  startGame(data.game);
});
```

---

### 4. make-move

Client submits move.

**Direction**: Client → Server

**Payload**:

```typescript
{
  gameId: string;
  move: {
    pieceId: string;
    toRow: number; // 0-7
    toCol: number; // 0-7
  }
}
```

**Example**:

```typescript
socket.emit('make-move', {
  gameId: 'game-uuid',
  move: {
    pieceId: 'p5',
    toRow: 4,
    toCol: 3,
  },
});
```

**Server Response Events**:

- `move-made` (success, broadcasted)
- `move-invalid` (failure, to sender only)

---

### 5. move-made

Notification that move was executed successfully.

**Direction**: Server → Clients (broadcasted to room)

**Payload**:

```typescript
{
  move: {
    id: string;
    sequenceNumber: number;
    color: 'WHITE' | 'BLACK';
    pieceId: string;
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
    capturedPieces: Array<{ id: string; row: number; col: number }>;
    wasPromotion: boolean;
    timestamp: string; // ISO date
  };
  game: {
    boardState: BoardState;
    currentTurn: 'WHITE' | 'BLACK';
    status: 'IN_PROGRESS' | 'FINISHED';
    result?: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW';
  };
}
```

**Example**:

```typescript
socket.on('move-made', (data) => {
  animateMove(data.move);
  updateBoard(data.game.boardState);

  if (data.move.capturedPieces.length > 0) {
    removePieces(data.move.capturedPieces);
  }

  if (data.move.wasPromotion) {
    promotePieceToKing(data.move.pieceId);
  }

  if (data.game.status === 'FINISHED') {
    showGameOver(data.game.result);
  }
});
```

---

### 6. move-invalid

Notification that move was rejected.

**Direction**: Server → Client (to sender only)

**Payload**:

```typescript
{
  error: string;
  reason:
    | 'not-your-turn'
    | 'invalid-move'
    | 'must-capture'
    | 'game-not-active';
  validMoves?: Array<{ row: number; col: number }>; // If applicable
}
```

**Example**:

```typescript
socket.on('move-invalid', (data) => {
  showError(data.error);
  if (data.validMoves) {
    highlightValidMoves(data.validMoves);
  }
});
```

---

### 7. player-disconnected

Notification when opponent disconnects.

**Direction**: Server → Client (to remaining player)

**Payload**:

```typescript
{
  playerId: string;
  username: string;
  color: 'WHITE' | 'BLACK';
  disconnectedAt: string; // ISO date
}
```

**Example**:

```typescript
socket.on('player-disconnected', (data) => {
  showNotification(`${data.username} disconnected`);
  startDisconnectTimer(data.disconnectedAt); // 5 min timer
});
```

---

### 8. player-reconnected

Notification when opponent reconnects.

**Direction**: Server → Client (to remaining player)

**Payload**:

```typescript
{
  playerId: string;
  username: string;
  color: 'WHITE' | 'BLACK';
  reconnectedAt: string; // ISO date
}
```

**Example**:

```typescript
socket.on('player-reconnected', (data) => {
  showNotification(`${data.username} reconnected`);
  cancelDisconnectTimer();
});
```

---

### 9. game-abandoned

Notification when opponent doesn't return within 5 minutes.

**Direction**: Server → Client

**Payload**:

```typescript
{
  gameId: string;
  winnerId: string;
  result: 'WHITE_WIN' | 'BLACK_WIN';
  reason: 'opponent-timeout';
}
```

**Example**:

```typescript
socket.on('game-abandoned', (data) => {
  showGameOver({
    result: data.result,
    reason: 'Opponent disconnected - You win!',
  });
});
```

---

### 10. resign

Client resigns from game.

**Direction**: Client → Server

**Payload**:

```typescript
{
  gameId: string;
}
```

**Example**:

```typescript
socket.emit('resign', { gameId: 'game-uuid' });
```

**Server Response**:

- `game-resigned` (broadcasted to room)

---

### 11. game-resigned

Notification that player resigned.

**Direction**: Server → Clients (broadcasted to room)

**Payload**:

```typescript
{
  gameId: string;
  resignedPlayerId: string;
  resignedPlayerColor: 'WHITE' | 'BLACK';
  winnerId: string;
  result: 'WHITE_WIN' | 'BLACK_WIN';
}
```

**Example**:

```typescript
socket.on('game-resigned', (data) => {
  showGameOver({
    result: data.result,
    reason: `${data.resignedPlayerColor} player resigned`,
  });
});
```

---

### 12. error

Generic error from server.

**Direction**: Server → Client

**Payload**:

```typescript
{
  message: string;
  code?: string;
  details?: object;
}
```

**Example**:

```typescript
socket.on('error', (error) => {
  console.error('WebSocket error:', error.message);
  showError(error.message);
});
```

---

## Room Management

### Namespaces

Using default namespace `/` for simplicity. Future: separate namespaces for chat, spectating.

### Rooms

Socket.io rooms correspond to game rooms. Room name = `game:${gameId}`.

**Server-side**:

```typescript
socket.on('join-room', async ({ roomCode }) => {
  const room = await findRoomByCode(roomCode);
  if (!room) {
    socket.emit('error', { message: 'Room not found' });
    return;
  }

  // Join Socket.io room
  socket.join(`game:${room.gameId}`);

  // Broadcast to room
  io.to(`game:${room.gameId}`).emit('player-joined', { ... });
});
```

---

## Reconnection Flow

### Client Reconnects

1. Client connects with same session token
2. Server identifies player by session
3. Server sends current state of all active games for that player

**Event**: `reconnect-state`

**Direction**: Server → Client (on connection)

**Payload**:

```typescript
{
  activeGames: Array<{
    gameId: string;
    roomCode: string;
    boardState: BoardState;
    currentTurn: 'WHITE' | 'BLACK';
    yourColor: 'WHITE' | 'BLACK';
    opponent: { username: string };
  }>;
}
```

**Example**:

```typescript
socket.on('connect', () => {
  // Automatically sent by server
});

socket.on('reconnect-state', (data) => {
  if (data.activeGames.length > 0) {
    showResumeGamePrompt(data.activeGames);
  }
});
```

---

## Rate Limiting

To prevent abuse and ensure fair play:

**Move Rate Limit**:

- Maximum 1 move per second per player
- Violations result in temporary socket disconnect

**Connection Rate Limit**:

- Maximum 10 connection attempts per minute per IP
- Exponential backoff enforced client-side

**Server Implementation**:

```typescript
const moveTimestamps = new Map<string, number>();

socket.on('make-move', (data) => {
  const lastMove = moveTimestamps.get(socket.data.playerId) || 0;
  const now = Date.now();

  if (now - lastMove < 1000) {
    socket.emit('error', {
      message: 'Move too fast - wait 1 second between moves',
    });
    return;
  }

  moveTimestamps.set(socket.data.playerId, now);
  // Process move...
});
```

---

## Error Handling

### Client-Side

```typescript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // Show reconnecting indicator
});

socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server kicked us - session invalid
    redirectToLogin();
  } else {
    // Network issue - Socket.io will auto-reconnect
    showReconnectingIndicator();
  }
});

socket.on('reconnect', (attemptNumber) => {
  hideReconnectingIndicator();
  console.log(`Reconnected after ${attemptNumber} attempts`);
});

socket.on('reconnect_failed', () => {
  showError('Failed to reconnect. Please refresh the page.');
});
```

### Server-Side

```typescript
io.use(async (socket, next) => {
  try {
    const session = await validateSession(socket.handshake.auth.sessionToken);
    if (!session) {
      return next(new Error('Unauthorized'));
    }
    socket.data.playerId = session.userId;
    next();
  } catch (error) {
    next(error);
  }
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Log to monitoring service
});
```

---

## Performance Considerations

### Message Compression

Enable Socket.io compression for payloads > 1KB:

```typescript
const io = new Server(server, {
  perMessageDeflate: {
    threshold: 1024, // Compress messages larger than 1KB
  },
});
```

### Binary Encoding (Future)

For high-frequency events, consider binary encoding (e.g., MessagePack) instead of JSON:

```typescript
// Future optimization if needed
const encodedMove = msgpack.encode(move);
socket.emit('move-made', encodedMove);
```

### Heartbeat

Socket.io handles heartbeat automatically:

- Default: ping every 25s, timeout after 20s of no response
- Adjust if needed: `pingInterval`, `pingTimeout` in server options

---

## Security

### Authentication

- Session token validated on connection
- Invalid token → disconnect immediately
- Token refresh handled by HTTP (not WebSocket)

### Authorization

- Players can only join rooms they're part of
- Players can only make moves in their turn
- All moves validated server-side (never trust client)

### Input Validation

- All event payloads validated with Zod schemas
- Invalid payloads → error event, no state change

**Example**:

```typescript
import { z } from 'zod';

const MakeMoveSchema = z.object({
  gameId: z.string().uuid(),
  move: z.object({
    pieceId: z.string(),
    toRow: z.number().int().min(0).max(7),
    toCol: z.number().int().min(0).max(7),
  }),
});

socket.on('make-move', (data) => {
  const parsed = MakeMoveSchema.safeParse(data);
  if (!parsed.success) {
    socket.emit('error', {
      message: 'Invalid move format',
      details: parsed.error,
    });
    return;
  }
  // Process valid move...
});
```

---

## Testing

### Unit Tests

Mock Socket.io for testing event handlers:

```typescript
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';

describe('WebSocket Events', () => {
  let io: Server;
  let clientSocket: Socket;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  test('should join room', (done) => {
    clientSocket.emit('join-room', { roomCode: 'ABC123' });
    clientSocket.on('room-joined', (data) => {
      expect(data.room.code).toBe('ABC123');
      done();
    });
  });
});
```

### Integration Tests (Playwright)

Test real WebSocket communication between two clients:

```typescript
test('two players can play online game', async ({ page, context }) => {
  const player2Page = await context.newPage();

  // Player 1 creates room
  await page.click('[data-testid="create-online-game"]');
  const roomCode = await page.locator('[data-testid="room-code"]').textContent();

  // Player 2 joins room
  await player2Page.goto('/game/online');
  await player2Page.fill('[data-testid="room-code-input"]', roomCode);
  await player2Page.click('[data-testid="join-room"]');

  // Verify both see board
  await expect(page.locator('[data-testid="game-board"]')).toBeVisible();
  await expect(player2Page.locator('[data-testid="game-board"]')).toBeVisible();

  // Player 1 makes move
  await page.click('[data-testid="piece-5-0"]');
  await page.click('[data-testid="square-4-1"]');

  // Verify Player 2 sees move
  await expect(player2Page.locator('[data-testid="piece-at-4-1"]')).toBeVisible();
});
```

---

## Summary

WebSocket protocol com 12 eventos principais (join-room, move-made, player-disconnected, etc) usando Socket.io 4.x. Autenticação via session token, validação server-side de todos os movimentos, reconexão automática, e rate limiting para prevenir abuso. Alinhado com requisitos de sincronização < 500ms e suporte a 100+ partidas simultâneas.
