/* eslint-disable no-console */
/**
 * T145: Prisma seed script
 *
 * Seeds the database with example data:
 * - 3 users (alice, bob, charlie)
 * - 2 games in progress (1 online, 1 bot)
 * - 1 waiting room
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { createInitialBoard } from '../src/lib/game/board';
import { serializeBoardState } from '../src/lib/utils/boardState';

const prisma = new PrismaClient();

const BCRYPT_WORK_FACTOR = 12;

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Clearing existing data...');
    await prisma.move.deleteMany();
    await prisma.game.deleteMany();
    await prisma.room.deleteMany();
    await prisma.session.deleteMany();
    await prisma.player.deleteMany();
  }

  // Create 3 example users
  console.log('👤 Creating users...');

  const passwordHash = await bcrypt.hash('password123', BCRYPT_WORK_FACTOR);

  const alice = await prisma.player.create({
    data: {
      email: 'alice@example.com',
      username: 'Alice',
      passwordHash,
      wins: 5,
      losses: 3,
      draws: 1,
      totalGames: 9,
    },
  });

  const bob = await prisma.player.create({
    data: {
      email: 'bob@example.com',
      username: 'Bob',
      passwordHash,
      wins: 3,
      losses: 5,
      draws: 2,
      totalGames: 10,
    },
  });

  const charlie = await prisma.player.create({
    data: {
      email: 'charlie@example.com',
      username: 'Charlie',
      passwordHash,
      wins: 0,
      losses: 0,
      draws: 0,
      totalGames: 0,
    },
  });

  console.log(`✅ Created users: ${alice.username}, ${bob.username}, ${charlie.username}`);

  // Prepare board state for games
  const initialBoard = createInitialBoard();
  const boardStateJson = serializeBoardState(initialBoard);

  // Create 1 waiting room with game
  console.log('🚪 Creating waiting room...');

  // First create a game for the room
  const roomGame = await prisma.game.create({
    data: {
      type: 'ONLINE',
      status: 'WAITING',
      whitePlayerId: charlie.id,
      currentTurn: 'WHITE',
      boardState: boardStateJson,
      moveCount: 0,
    },
  });

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Expires in 1 hour

  const room = await prisma.room.create({
    data: {
      code: 'ABC123',
      gameId: roomGame.id,
      hostPlayerId: charlie.id,
      status: 'WAITING',
      expiresAt,
    },
  });

  console.log(`✅ Created room: ${room.code} (waiting for player)`);

  // Create 1 online game in progress (Alice vs Bob)
  console.log('🎮 Creating online game in progress...');

  await prisma.game.create({
    data: {
      type: 'ONLINE',
      status: 'IN_PROGRESS',
      whitePlayerId: alice.id,
      blackPlayerId: bob.id,
      currentTurn: 'WHITE',
      boardState: boardStateJson,
      moveCount: 0,
    },
  });

  console.log(`✅ Created online game: ${alice.username} (white) vs ${bob.username} (black)`);

  // Create 1 bot game in progress (Alice vs Bot Easy)
  console.log('🤖 Creating bot game in progress...');

  await prisma.game.create({
    data: {
      type: 'BOT',
      status: 'IN_PROGRESS',
      whitePlayerId: alice.id,
      botDifficulty: 'EASY',
      currentTurn: 'WHITE',
      boardState: boardStateJson,
      moveCount: 0,
    },
  });

  console.log(`✅ Created bot game: ${alice.username} (white) vs Bot (black, EASY)`);

  // Create some sessions
  console.log('🔐 Creating sessions...');

  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days from now

  await prisma.session.create({
    data: {
      sessionToken: 'alice-session-token-12345',
      userId: alice.id,
      expires,
    },
  });

  await prisma.session.create({
    data: {
      sessionToken: 'bob-session-token-67890',
      userId: bob.id,
      expires,
    },
  });

  console.log(`✅ Created sessions for ${alice.username} and ${bob.username}`);

  // Summary
  console.log('\n✨ Seed completed successfully!\n');
  console.log('📊 Database summary:');
  console.log(`   - Users: 3 (alice@example.com, bob@example.com, charlie@example.com)`);
  console.log(`   - Password for all: password123`);
  console.log(`   - Games in progress: 2 (1 online, 1 bot)`);
  console.log(`   - Waiting rooms: 1 (code: ABC123)`);
  console.log(`   - Sessions: 2 (alice, bob)\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
