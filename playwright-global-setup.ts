import { chromium } from '@playwright/test'
import { existsSync } from 'fs'

async function globalSetup() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Verify the app is running
  await page.goto('http://localhost:3000/')
  await page.waitForLoadState('networkidle')

  // Only regenerate auth fixtures if they don't exist
  // This avoids the better-sqlite3 dependency issue
  const parentFixture = 'e2e/fixtures/auth/parent.local.json'
  const studentFixture = 'e2e/fixtures/auth/student.local.json'
  
  if (!existsSync(parentFixture) || !existsSync(studentFixture)) {
    console.log('Auth fixtures missing - run `bun run e2e/setup-auth-fixtures.ts` manually')
  }

  await browser.close()
}

export default globalSetup
