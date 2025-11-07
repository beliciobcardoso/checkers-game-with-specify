/**
 * T086: Teste E2E multiplayer online
 *
 * Simula dois navegadores independentes (host e convidado) autenticados que
 * criam uma sala, ingressam através do código e executam um movimento, validando
 * que ambos os clientes recebem o estado atualizado.
 */

import { test, expect, APIRequestContext, BrowserContext } from '@playwright/test';

const hostCredentials = {
  email: `e2e-host-${Date.now()}@example.com`,
  password: 'E2EHostPass123!',
  username: `E2EHost${Date.now()}`,
};

const guestCredentials = {
  email: `e2e-guest-${Date.now()}@example.com`,
  password: 'E2EGuestPass123!',
  username: `E2EGuest${Date.now()}`,
};

async function registerUser(request: APIRequestContext, credentials: typeof hostCredentials) {
  const response = await request.post('/api/auth/register', {
    data: {
      email: credentials.email,
      password: credentials.password,
      username: credentials.username,
    },
  });

  if (response.status() !== 201 && response.status() !== 409) {
    throw new Error(`Falha ao registrar usuário: ${response.status()} ${await response.text()}`);
  }
}

async function loginUser(request: APIRequestContext, credentials: typeof hostCredentials) {
  const response = await request.post('/api/auth/login', {
    data: {
      email: credentials.email,
      password: credentials.password,
    },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  return body.sessionToken as string;
}

async function authenticateContext(
  request: APIRequestContext,
  context: BrowserContext,
  credentials: typeof hostCredentials
) {
  await registerUser(request, credentials);
  const sessionToken = await loginUser(request, credentials);

  await context.addCookies([
    {
      name: 'session-token',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: false,
    },
  ]);
}

test.describe('Online Multiplayer Game', () => {
  test('host e convidado devem jogar partida online sincronizada', async ({ browser, request }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    try {
      await authenticateContext(request, hostContext, hostCredentials);
      await authenticateContext(request, guestContext, guestCredentials);

      const hostPage = await hostContext.newPage();
      const guestPage = await guestContext.newPage();

      await hostPage.goto('/game/online');
      await hostPage.click('[data-testid="create-room-button"]');

      const roomCodeLocator = hostPage.locator('[data-testid="room-code"]');
      await expect(roomCodeLocator).toBeVisible();
      const roomCodeText = (await roomCodeLocator.textContent())?.trim() ?? '';
      expect(roomCodeText).toMatch(/^[A-Z0-9]{6}$/);

      await guestPage.goto('/game/online');
      await guestPage.fill('[data-testid="join-room-input"]', roomCodeText);
      await guestPage.click('[data-testid="join-room-submit"]');

      await hostPage.waitForSelector('[data-testid="waiting-room-player"][data-role="guest"]', {
        timeout: 10000,
      });
      await guestPage.waitForSelector('[data-testid="waiting-room-player"][data-role="host"]', {
        timeout: 10000,
      });

      await hostPage.waitForSelector('[data-testid="online-board"]', { timeout: 10000 });
      await guestPage.waitForSelector('[data-testid="online-board"]', { timeout: 10000 });

      const hostPiece = hostPage.locator('[data-testid="piece-white"]').first();
      await hostPiece.click();
      await hostPage.waitForSelector('[data-testid="square-highlighted"]');
      await hostPage.locator('[data-testid="square-highlighted"]').first().click();

      await guestPage.waitForSelector('[data-testid="last-move-indicator"]', {
        timeout: 10000,
      });

      const guestTurnText = await guestPage.locator('[data-testid="turn-indicator"]').textContent();
      expect(guestTurnText).toContain('Pretas');
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});
