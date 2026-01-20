import { chromium } from '@playwright/test'
import { setupAuthFixtures } from './e2e/setup-auth-fixtures'

async function globalSetup() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Verify the app is running
  await page.goto('http://localhost:3000/')
  await page.waitForLoadState('networkidle')

  // Generate auth fixtures using the known seed email
  await setupAuthFixtures()

  await browser.close()
}

export default globalSetup
