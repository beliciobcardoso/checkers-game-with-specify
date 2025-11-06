-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('LOCAL', 'ONLINE', 'BOT');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'FINISHED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "GameResult" AS ENUM ('WHITE_WIN', 'BLACK_WIN', 'DRAW');

-- CreateEnum
CREATE TYPE "Color" AS ENUM ('WHITE', 'BLACK');

-- CreateEnum
CREATE TYPE "BotDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('WAITING', 'ACTIVE', 'FINISHED');

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "type" "GameType" NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'WAITING',
    "result" "GameResult",
    "boardState" JSONB NOT NULL,
    "currentTurn" "Color" NOT NULL DEFAULT 'WHITE',
    "whitePlayerId" TEXT,
    "blackPlayerId" TEXT,
    "botDifficulty" "BotDifficulty",
    "moveCount" INTEGER NOT NULL DEFAULT 0,
    "lastMoveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moves" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "color" "Color" NOT NULL,
    "pieceId" TEXT NOT NULL,
    "fromRow" INTEGER NOT NULL,
    "fromCol" INTEGER NOT NULL,
    "toRow" INTEGER NOT NULL,
    "toCol" INTEGER NOT NULL,
    "capturedPieces" JSONB NOT NULL,
    "wasPromotion" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'WAITING',
    "hostPlayerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_email_key" ON "players"("email");

-- CreateIndex
CREATE UNIQUE INDEX "players_username_key" ON "players"("username");

-- CreateIndex
CREATE INDEX "players_email_idx" ON "players"("email");

-- CreateIndex
CREATE INDEX "players_username_idx" ON "players"("username");

-- CreateIndex
CREATE INDEX "players_createdAt_idx" ON "players"("createdAt");

-- CreateIndex
CREATE INDEX "games_status_type_idx" ON "games"("status", "type");

-- CreateIndex
CREATE INDEX "games_whitePlayerId_idx" ON "games"("whitePlayerId");

-- CreateIndex
CREATE INDEX "games_blackPlayerId_idx" ON "games"("blackPlayerId");

-- CreateIndex
CREATE INDEX "games_createdAt_idx" ON "games"("createdAt");

-- CreateIndex
CREATE INDEX "games_status_createdAt_idx" ON "games"("status", "createdAt");

-- CreateIndex
CREATE INDEX "moves_gameId_idx" ON "moves"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "moves_gameId_sequenceNumber_key" ON "moves"("gameId", "sequenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_gameId_key" ON "rooms"("gameId");

-- CreateIndex
CREATE INDEX "rooms_code_idx" ON "rooms"("code");

-- CreateIndex
CREATE INDEX "rooms_status_createdAt_idx" ON "rooms"("status", "createdAt");

-- CreateIndex
CREATE INDEX "rooms_expiresAt_idx" ON "rooms"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_sessionToken_idx" ON "sessions"("sessionToken");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_whitePlayerId_fkey" FOREIGN KEY ("whitePlayerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_blackPlayerId_fkey" FOREIGN KEY ("blackPlayerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moves" ADD CONSTRAINT "moves_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hostPlayerId_fkey" FOREIGN KEY ("hostPlayerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
