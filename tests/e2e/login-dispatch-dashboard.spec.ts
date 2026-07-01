import { test, expect } from '@playwright/test'

// Requires a real Supabase project with a seeded controller (or admin) account.
// Set E2E_TEST_EMAIL / E2E_TEST_PASSWORD env vars before running:
//   E2E_TEST_EMAIL=controller@example.com E2E_TEST_PASSWORD=... npx playwright test
const EMAIL = process.env.E2E_TEST_EMAIL || ''
const PASSWORD = process.env.E2E_TEST_PASSWORD || ''

test.describe('login → dispatch entry → dashboard', () => {
  test.skip(!EMAIL || !PASSWORD, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run this against a real Supabase project')

  test('logs in, enters a dispatch row, sees it reflected on the dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('Email').fill(EMAIL)
    await page.getByPlaceholder('Password').fill(PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/.*dashboard/)

    await page.goto('/entry')
    await page.getByPlaceholder('Trailer plate').first().fill('TEST-01')
    await page.getByPlaceholder('Project no').first().fill('P-TEST')
    await page.getByPlaceholder('DO No').fill(`E2E-${Date.now()}`)
    await page.getByRole('button', { name: /^save$/i }).click()

    await page.goto('/dashboard')
    await expect(page.getByText('Trips')).toBeVisible()
  })
})
