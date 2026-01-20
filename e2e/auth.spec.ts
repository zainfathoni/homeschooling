import { test, expect } from './base-test'
import { LoginPage } from './pages/login.page'

/**
 * E2E tests for authentication flows.
 * Tests login, logout, validation, and protected route behavior.
 *
 * Usage:
 *   npm run test:e2e -- auth.spec.ts
 */

test.describe('Auth - Login page display', () => {
  test('displays login form with email input and submit button', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.expectLoaded()
  })

  test('shows placeholder text in email input', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await expect(loginPage.emailInput).toHaveAttribute('placeholder', 'parent@example.com')
  })

  test('displays info about magic link authentication', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await expect(page.getByText(/No password needed/i)).toBeVisible()
  })
})

test.describe('Auth - Magic link request', () => {
  test('shows success message after submitting valid email', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for form submission feedback')
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.fillEmail('newuser@example.com')
    await loginPage.submit()

    await expect(page.getByText('newuser@example.com')).toBeVisible()
  })
})

test.describe('Auth - Email validation', () => {
  test('email input has required attribute', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await expect(loginPage.emailInput).toHaveAttribute('required')
  })

  test('email input has email type for browser validation', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await expect(loginPage.emailInput).toHaveAttribute('type', 'email')
  })
})

test.describe('Auth - Logout', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
  })

  test('authenticated user can access week page', async ({ page }) => {
    await page.goto('/week')
    await expect(page).toHaveURL(/\/week\//)
  })

  test('logout endpoint returns redirect response', async ({ request }) => {
    const response = await request.get('/logout', { maxRedirects: 0 })
    expect(response.status()).toBe(302)
    expect(response.headers()['location']).toBe('/login')
  })
})

test.describe('Auth - Protected routes', () => {
  test('unauthenticated user is redirected to login from /week', async ({ page }) => {
    await page.goto('/week')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated user is redirected to login from /narrations', async ({ page }) => {
    await page.goto('/narrations')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redirectTo param preserves intended destination', async ({ page }) => {
    await page.goto('/week')
    await expect(page).toHaveURL(/\/login\?redirectTo=/)
    const url = new URL(page.url())
    expect(url.searchParams.get('redirectTo')).toBe('/week')
  })
})

test.describe('Auth - Already logged in', () => {
  test.use({
    storageState: 'e2e/fixtures/auth/parent.local.json',
  })

  test('logged in user visiting /login is redirected to home', async ({ page }) => {
    await page.goto('/login')
    await expect(page).not.toHaveURL('/login')
  })
})
