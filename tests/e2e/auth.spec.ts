/**
 * T060: Teste E2E de registro e login
 * Criar conta, logout, login novamente
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Flow', () => {
  const timestamp = Date.now();
  const testEmail = `e2e-test-${timestamp}@example.com`;
  const testUsername = `E2EUser${timestamp}`;
  const testPassword = 'E2ETestPass123!';

  test('should complete full registration and login flow', async ({ page }) => {
    // Ir para página de registro
    await page.goto('/register');

    // Preencher formulário de registro
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Submeter formulário
    await page.click('button[type="submit"]');

    // Deve redirecionar para home ou perfil após registro
    await expect(page).toHaveURL(/\/(home|profile)/);

    // Deve exibir mensagem de sucesso
    await expect(page.locator('text=Conta criada com sucesso')).toBeVisible({
      timeout: 5000,
    });

    // Deve exibir nome do usuário
    await expect(page.locator(`text=${testUsername}`)).toBeVisible();
  });

  test('should logout and login again', async ({ page }) => {
    // Fazer login primeiro
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/(home|profile)/);

    // Fazer logout
    await page.click('button[aria-label="Menu"]'); // ou seletor do menu
    await page.click('text=Sair');

    // Deve redirecionar para login ou home pública
    await expect(page).toHaveURL(/\/(login|\/)/);

    // Deve exibir mensagem de logout
    await expect(page.locator('text=Logout realizado com sucesso')).toBeVisible(
      {
        timeout: 5000,
      }
    );

    // Fazer login novamente
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Deve estar autenticado
    await expect(page).toHaveURL(/\/(home|profile)/);
    await expect(page.locator(`text=${testUsername}`)).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/register');

    // Tentar submeter formulário vazio
    await page.click('button[type="submit"]');

    // Deve exibir erros de validação
    await expect(page.locator('text=Email é obrigatório')).toBeVisible();
    await expect(page.locator('text=Senha é obrigatória')).toBeVisible();
    await expect(page.locator('text=Username é obrigatório')).toBeVisible();

    // Tentar email inválido
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'short');
    await page.fill('input[name="username"]', 'ab'); // muito curto

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Email inválido')).toBeVisible();
    await expect(
      page.locator('text=Senha deve ter no mínimo 8 caracteres')
    ).toBeVisible();
    await expect(
      page.locator('text=Username deve ter no mínimo 3 caracteres')
    ).toBeVisible();
  });

  test('should prevent duplicate registration', async ({ page }) => {
    // Tentar registrar com email já usado
    await page.goto('/register');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="username"]', 'AnotherUsername');
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    await page.click('button[type="submit"]');

    // Deve exibir erro
    await expect(page.locator('text=Email já cadastrado')).toBeVisible({
      timeout: 5000,
    });

    // Não deve redirecionar
    await expect(page).toHaveURL('/register');
  });

  test('should show error for wrong password on login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'WrongPassword123!');

    await page.click('button[type="submit"]');

    // Deve exibir erro
    await expect(page.locator('text=Credenciais inválidas')).toBeVisible({
      timeout: 5000,
    });

    // Não deve redirecionar
    await expect(page).toHaveURL('/login');
  });

  test('should require matching passwords on registration', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="email"]', `new-${testEmail}`);
    await page.fill('input[name="username"]', `New${testUsername}`);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');

    await page.click('button[type="submit"]');

    // Deve exibir erro
    await expect(page.locator('text=Senhas não coincidem')).toBeVisible();
  });

  test('should persist session across page reloads', async ({ page }) => {
    // Fazer login
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/(home|profile)/);

    // Recarregar página
    await page.reload();

    // Deve continuar autenticado
    await expect(page.locator(`text=${testUsername}`)).toBeVisible();

    // Navegar para outra página
    await page.goto('/profile');

    // Ainda autenticado
    await expect(page.locator(`text=${testUsername}`)).toBeVisible();
  });

  test('should protect authenticated routes', async ({ page, context }) => {
    // Limpar cookies (logout forçado)
    await context.clearCookies();

    // Tentar acessar rota protegida
    await page.goto('/profile');

    // Deve redirecionar para login
    await expect(page).toHaveURL('/login');

    // Deve exibir mensagem
    await expect(
      page.locator('text=Faça login para continuar')
    ).toBeVisible();
  });

  test('should remember user preference for "remember me"', async ({
    page,
    context,
  }) => {
    // Limpar cookies
    await context.clearCookies();

    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    // Marcar "lembrar de mim"
    await page.check('input[name="rememberMe"]');
    
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/(home|profile)/);

    // Fechar e reabrir navegador (novo contexto)
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'session-token');

    // Cookie deve ter expiração longa (7 dias)
    expect(sessionCookie).toBeDefined();
    const expirationTime = sessionCookie!.expires * 1000; // converter para ms
    const now = Date.now();
    const daysUntilExpiration = (expirationTime - now) / (1000 * 60 * 60 * 24);

    expect(daysUntilExpiration).toBeGreaterThan(6); // pelo menos 6 dias
  });
});
