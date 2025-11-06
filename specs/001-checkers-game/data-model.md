# Data Model

**Feature**: Jogo de Damas Multiplayer  
**Date**: 2025-11-05  
**Database**: PostgreSQL 15+  
**ORM**: Prisma 5.x

## Overview

Modelo de dados para suportar autenticação de jogadores, gerenciamento de partidas (local/online/bot), salas de jogo online, histórico de movimentos, e estatísticas. Design normalizado com JSONB para estado do tabuleiro (flexibilidade + performance).

---

## Entities

### 1. Player

Representa usuário do sistema (autenticado ou anônimo para modo local).

**Attributes**:
- `id`: String (UUID) - Primary key
- `email`: String (unique, nullable) - Email para autenticação (null se anônimo)
- `username`: String (unique, nullable) - Nome de exibição
- `passwordHash`: String (nullable) - Bcrypt hash da senha (null se anônimo)
- `createdAt`: DateTime - Data de criação da conta
- `updatedAt`: DateTime - Última atualização
- `lastLoginAt`: DateTime (nullable) - Último login

**Statistics** (denormalizados para performance):
- `totalGames`: Int (default 0) - Total de partidas jogadas
- `wins`: Int (default 0) - Vitórias
- `losses`: Int (default 0) - Derrotas
- `draws`: Int (default 0) - Empates

**Relationships**:
- `gamesAsWhite`: Game[] - Partidas onde jogou como branco
- `gamesAsBlack`: Game[] - Partidas onde jogou como preto
- `sessions`: Session[] - Sessões de autenticação ativas

**Validation Rules**:
- Email deve ser válido e único (se fornecido)
- Username único (se fornecido)
- PasswordHash mínimo 8 caracteres antes do hash
- Estatísticas não podem ser negativas

**Indexes**:
- `email` (unique, sparse) - Login lookup
- `username` (unique, sparse) - Profile lookup
- `createdAt` - Ordenação por data de cadastro

---

### 2. Game

Representa uma partida (local, online ou contra bot).

**Attributes**:
- `id`: String (UUID) - Primary key
- `type`: Enum('LOCAL', 'ONLINE', 'BOT') - Tipo de partida
- `status`: Enum('WAITING', 'IN_PROGRESS', 'FINISHED', 'ABANDONED') - Estado atual
- `result`: Enum('WHITE_WIN', 'BLACK_WIN', 'DRAW', null) - Resultado (null se em andamento)
- `boardState`: JSONB - Estado atual do tabuleiro (veja estrutura abaixo)
- `currentTurn`: Enum('WHITE', 'BLACK') - Turno atual
- `whitePlayerId`: String (nullable, FK → Player) - Jogador branco (null se bot/anônimo)
- `blackPlayerId`: String (nullable, FK → Player) - Jogador preto (null se bot/anônimo)
- `botDifficulty`: Enum('EASY', 'MEDIUM', 'HARD', null) - Dificuldade do bot (null se não for bot)
- `moveCount`: Int (default 0) - Número de movimentos realizados
- `lastMoveAt`: DateTime (nullable) - Timestamp do último movimento
- `createdAt`: DateTime - Data de criação da partida
- `updatedAt`: DateTime - Última atualização

**BoardState Structure** (JSONB):
```json
{
  "pieces": [
    {"id": "p1", "color": "WHITE", "type": "MAN", "row": 5, "col": 0},
    {"id": "p2", "color": "WHITE", "type": "KING", "row": 3, "col": 2},
    {"id": "p3", "color": "BLACK", "type": "MAN", "row": 2, "col": 1}
  ],
  "capturedPieces": {
    "white": 3,
    "black": 5
  },
  "positionHistory": [
    "hash1", "hash2", "hash3"  // Para detectar repetição de posição
  ]
}
```

**Relationships**:
- `whitePlayer`: Player (nullable) - Relação com jogador branco
- `blackPlayer`: Player (nullable) - Relação com jogador preto
- `moves`: Move[] - Histórico de movimentos
- `room`: Room (nullable) - Sala online associada (null se local/bot)

**Validation Rules**:
- `type` ONLINE requer `room` associado
- `type` BOT requer `botDifficulty` definido
- `status` FINISHED requer `result` definido
- `boardState` deve conter array `pieces` válido
- `moveCount` >= número de itens em `moves`

**State Transitions**:
```
WAITING → IN_PROGRESS (quando segundo jogador entra/bot inicia)
IN_PROGRESS → FINISHED (quando condição de vitória/empate detectada)
IN_PROGRESS → ABANDONED (quando jogador desconecta > 24h)
```

**Indexes**:
- `status, type` (composite) - Query de jogos ativos por tipo
- `whitePlayerId` - Jogos de um jogador
- `blackPlayerId` - Jogos de um jogador
- `createdAt` - Ordenação temporal
- `boardState` (GIN index) - Queries em JSONB

---

### 3. Move

Representa um movimento individual em uma partida.

**Attributes**:
- `id`: String (UUID) - Primary key
- `gameId`: String (FK → Game) - Partida associada
- `sequenceNumber`: Int - Número sequencial do movimento (1, 2, 3...)
- `color`: Enum('WHITE', 'BLACK') - Cor da peça movida
- `pieceId`: String - ID da peça no boardState
- `fromRow`: Int (0-7) - Linha de origem
- `fromCol`: Int (0-7) - Coluna de origem
- `toRow`: Int (0-7) - Linha de destino
- `toCol`: Int (0-7) - Coluna de destino
- `capturedPieces`: JSONB (array) - Peças capturadas neste movimento
  ```json
  [
    {"id": "p5", "row": 3, "col": 3},
    {"id": "p7", "row": 1, "col": 5}  // Captura múltipla
  ]
  ```
- `wasPromotion`: Boolean (default false) - Se peça foi promovida a dama
- `timestamp`: DateTime - Quando o movimento foi feito

**Relationships**:
- `game`: Game - Partida associada

**Validation Rules**:
- `sequenceNumber` deve ser único por `gameId` e incremental
- Coordenadas devem estar entre 0-7
- `fromRow, fromCol` diferente de `toRow, toCol`
- `capturedPieces` pode ser array vazio (movimento sem captura)

**Indexes**:
- `gameId, sequenceNumber` (composite, unique) - Query de movimentos por ordem
- `gameId` - Todos os movimentos de uma partida

---

### 4. Room

Representa sala de jogo online para partidas multiplayer.

**Attributes**:
- `id`: String (UUID) - Primary key
- `code`: String (6 caracteres, unique) - Código alfanumérico para entrar na sala
- `gameId`: String (FK → Game, unique) - Partida associada (1:1)
- `status`: Enum('WAITING', 'ACTIVE', 'FINISHED') - Estado da sala
- `hostPlayerId`: String (nullable, FK → Player) - Criador da sala
- `createdAt`: DateTime - Data de criação
- `expiresAt`: DateTime - Expira 24h após criação se não iniciar

**Relationships**:
- `game`: Game - Partida associada
- `host`: Player (nullable) - Jogador que criou a sala

**Validation Rules**:
- `code` deve ser 6 caracteres alfanuméricos uppercase
- `code` deve ser único
- `expiresAt` = `createdAt` + 24 horas
- `status` ACTIVE requer `game.status` = IN_PROGRESS

**State Transitions**:
```
WAITING → ACTIVE (quando segundo jogador entra e partida inicia)
ACTIVE → FINISHED (quando partida termina)
```

**Indexes**:
- `code` (unique) - Lookup rápido por código
- `status, createdAt` (composite) - Query de salas ativas
- `expiresAt` - Cleanup de salas expiradas

---

### 5. Session

Representa sessão de autenticação (NextAuth.js 4.x gerencia, mas documentado para referência).

**Attributes**:
- `id`: String (UUID) - Primary key
- `sessionToken`: String (unique) - Token da sessão
- `userId`: String (FK → Player) - Usuário autenticado
- `expires`: DateTime - Data de expiração (7 dias)

**Relationships**:
- `user`: Player - Usuário associado

**Validation Rules**:
- `sessionToken` deve ser único
- `expires` deve ser futuro

**Indexes**:
- `sessionToken` (unique) - Lookup por token
- `userId` - Sessões de um usuário

---

## Relationships Diagram

```
Player
├─── gamesAsWhite ────> Game (1:N)
├─── gamesAsBlack ────> Game (1:N)
└─── sessions ────────> Session (1:N)

Game
├─── whitePlayer ────> Player (N:1, nullable)
├─── blackPlayer ────> Player (N:1, nullable)
├─── moves ──────────> Move (1:N)
└─── room ───────────> Room (1:1, nullable)

Move
└─── game ───────────> Game (N:1)

Room
├─── game ───────────> Game (1:1)
└─── host ───────────> Player (N:1, nullable)

Session
└─── user ───────────> Player (N:1)
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum GameType {
  LOCAL
  ONLINE
  BOT
}

enum GameStatus {
  WAITING
  IN_PROGRESS
  FINISHED
  ABANDONED
}

enum GameResult {
  WHITE_WIN
  BLACK_WIN
  DRAW
}

enum PlayerColor {
  WHITE
  BLACK
}

enum BotDifficulty {
  EASY
  MEDIUM
  HARD
}

enum RoomStatus {
  WAITING
  ACTIVE
  FINISHED
}

model Player {
  id            String    @id @default(uuid())
  email         String?   @unique
  username      String?   @unique
  passwordHash  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  // Statistics
  totalGames    Int       @default(0)
  wins          Int       @default(0)
  losses        Int       @default(0)
  draws         Int       @default(0)
  
  // Relationships
  gamesAsWhite  Game[]    @relation("WhitePlayer")
  gamesAsBlack  Game[]    @relation("BlackPlayer")
  sessions      Session[]
  hostedRooms   Room[]    @relation("RoomHost")
  
  @@index([email])
  @@index([username])
  @@index([createdAt])
}

model Game {
  id              String       @id @default(uuid())
  type            GameType
  status          GameStatus   @default(WAITING)
  result          GameResult?
  boardState      Json         // JSONB para estado do tabuleiro
  currentTurn     PlayerColor  @default(WHITE)
  whitePlayerId   String?
  blackPlayerId   String?
  botDifficulty   BotDifficulty?
  moveCount       Int          @default(0)
  lastMoveAt      DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  // Relationships
  whitePlayer     Player?      @relation("WhitePlayer", fields: [whitePlayerId], references: [id])
  blackPlayer     Player?      @relation("BlackPlayer", fields: [blackPlayerId], references: [id])
  moves           Move[]
  room            Room?
  
  @@index([status, type])
  @@index([whitePlayerId])
  @@index([blackPlayerId])
  @@index([createdAt])
}

model Move {
  id              String       @id @default(uuid())
  gameId          String
  sequenceNumber  Int
  color           PlayerColor
  pieceId         String
  fromRow         Int
  fromCol         Int
  toRow           Int
  toCol           Int
  capturedPieces  Json         // Array de peças capturadas
  wasPromotion    Boolean      @default(false)
  timestamp       DateTime     @default(now())
  
  // Relationships
  game            Game         @relation(fields: [gameId], references: [id], onDelete: Cascade)
  
  @@unique([gameId, sequenceNumber])
  @@index([gameId])
}

model Room {
  id              String       @id @default(uuid())
  code            String       @unique @db.VarChar(6)
  gameId          String       @unique
  status          RoomStatus   @default(WAITING)
  hostPlayerId    String?
  createdAt       DateTime     @default(now())
  expiresAt       DateTime
  
  // Relationships
  game            Game         @relation(fields: [gameId], references: [id], onDelete: Cascade)
  host            Player?      @relation("RoomHost", fields: [hostPlayerId], references: [id])
  
  @@index([code])
  @@index([status, createdAt])
  @@index([expiresAt])
}

model Session {
  id            String   @id @default(uuid())
  sessionToken  String   @unique
  userId        String
  expires       DateTime
  
  // Relationships
  user          Player   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([sessionToken])
  @@index([userId])
}
```

---

## Queries & Operations

### Common Queries

**1. Get Active Games for Player**
```typescript
const activeGames = await prisma.game.findMany({
  where: {
    OR: [
      { whitePlayerId: playerId },
      { blackPlayerId: playerId }
    ],
    status: 'IN_PROGRESS'
  },
  include: {
    whitePlayer: { select: { username: true } },
    blackPlayer: { select: { username: true } },
    room: { select: { code: true } }
  },
  orderBy: { lastMoveAt: 'desc' }
});
```

**2. Get Game with Move History**
```typescript
const game = await prisma.game.findUnique({
  where: { id: gameId },
  include: {
    moves: {
      orderBy: { sequenceNumber: 'asc' }
    }
  }
});
```

**3. Create Game with Room (Online)**
```typescript
const game = await prisma.game.create({
  data: {
    type: 'ONLINE',
    status: 'WAITING',
    boardState: initialBoardState,
    whitePlayerId: hostPlayerId,
    room: {
      create: {
        code: generateRoomCode(),
        hostPlayerId: hostPlayerId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    }
  },
  include: { room: true }
});
```

**4. Save Move with Transaction**
```typescript
const result = await prisma.$transaction(async (tx) => {
  // Create move
  const move = await tx.move.create({
    data: {
      gameId,
      sequenceNumber: currentMoveCount + 1,
      color,
      pieceId,
      fromRow,
      fromCol,
      toRow,
      toCol,
      capturedPieces,
      wasPromotion
    }
  });
  
  // Update game state
  const updatedGame = await tx.game.update({
    where: { id: gameId },
    data: {
      boardState: newBoardState,
      currentTurn: nextTurn,
      moveCount: { increment: 1 },
      lastMoveAt: new Date()
    }
  });
  
  return { move, game: updatedGame };
});
```

**5. Update Player Statistics After Game**
```typescript
await prisma.player.update({
  where: { id: winnerId },
  data: {
    totalGames: { increment: 1 },
    wins: { increment: 1 }
  }
});

await prisma.player.update({
  where: { id: loserId },
  data: {
    totalGames: { increment: 1 },
    losses: { increment: 1 }
  }
});
```

**6. Cleanup Expired Rooms**
```typescript
// Cron job (diário)
await prisma.room.deleteMany({
  where: {
    expiresAt: { lt: new Date() },
    status: 'WAITING'
  }
});
```

---

## Performance Considerations

### Indexes

- **Composite indexes** para queries frequentes (status + type, status + createdAt)
- **GIN index** em `boardState` para queries JSONB (se necessário buscar por posições)
- **Partial indexes** em campos nullable (email, username) para performance

### Denormalization

- **Player statistics** denormalizadas (totalGames, wins, etc) para evitar COUNT queries
- Trade-off: atualização em duas tabelas (Player + Game) vs query rápida

### JSONB Benefits

- **boardState** em JSONB permite:
  - Schema flexível (adicionar campos sem migration)
  - Queries eficientes com operadores `@>`, `->`
  - Indexação com GIN para busca rápida
- Alternative SQL approach rejeitada: ~40 rows por game (12 peças x 2 cores + casa vazias)

### Connection Pooling

- Prisma gerencia pool automaticamente
- Configure `connection_limit` em DATABASE_URL se necessário (default: CPUs * 2 + 1)

---

## Migration Strategy

### Initial Migration

```bash
npx prisma migrate dev --name init
```

### Future Migrations

- Always test em banco de desenvolvimento primeiro
- Use `prisma migrate deploy` em produção (não gera migrations)
- Backup antes de migrations destrutivas

### Seed Data

```typescript
// prisma/seed.ts
const testPlayer = await prisma.player.create({
  data: {
    email: 'test@example.com',
    username: 'TestPlayer',
    passwordHash: await bcrypt.hash('password123', 12)
  }
});
```

---

## Data Integrity Rules

1. **Referential Integrity**: Cascade deletes configurados (deletar Game → deleta Moves, Room)
2. **Constraints**: Unique constraints em email, username, sessionToken, room code
3. **Validation**: Zod schemas no application layer validam antes de salvar
4. **Transactions**: Operações compostas (criar game + room, salvar move + atualizar game) em transactions
5. **Soft Deletes**: Não implementado no MVP (games são mantidos para histórico)

---

## Security Considerations

- **Password hashing**: Bcrypt work factor 12 (não armazenado no schema, feito no app layer)
- **Session tokens**: Gerados securamente por NextAuth.js 4.x
- **SQL Injection**: Prisma previne automaticamente (parameterized queries)
- **JSONB validation**: Validar estrutura antes de salvar (Zod schema)

---

## Summary

Modelo de dados normalizado com 5 tabelas principais (Player, Game, Move, Room, Session), usando JSONB para flexibilidade no estado do tabuleiro. Indexes otimizados para queries comuns, transactions para consistência, e design alinhado com requisitos de partidas local/online/bot e sistema de autenticação.
