import { expect } from '@jest/globals';

export const API_BASE_URL = 'http://localhost:3000/api';

export const ROOM_CODE_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export type PlayerCredentials = {
  email: string;
  username: string;
  password: string;
};

export const generateTestEmail = (label: string) =>
  `test-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

export const generateTestUsername = (prefix: string) =>
  `${prefix}${Math.random().toString(36).slice(2, 6)}`;

export const generateRandomRoomCode = () =>
  Array.from({ length: 6 }, () =>
    ROOM_CODE_CHARACTERS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARACTERS.length))
  ).join('');

export async function registerPlayer(credentials: PlayerCredentials): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: credentials.email,
      username: credentials.username,
      password: credentials.password,
    }),
  });

  expect(response.status).toBe(201);
  const data = await response.json();
  return data.player.id as string;
}

export async function loginPlayer(credentials: PlayerCredentials): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

  expect(response.status).toBe(200);
  const data = await response.json();
  return data.sessionToken as string;
}

export async function createPlayerSession(
  credentials: PlayerCredentials
): Promise<{ playerId: string; sessionToken: string }> {
  const playerId = await registerPlayer(credentials);
  const sessionToken = await loginPlayer(credentials);
  return { playerId, sessionToken };
}

export async function createRoom(sessionToken: string) {
  const response = await fetch(`${API_BASE_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session-token=${sessionToken}`,
    },
  });

  expect(response.status).toBe(201);
  return response.json();
}
