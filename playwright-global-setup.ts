import { chromium } from '@playwright/test'

async function globalSetup() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Verify the app is running
  await page.goto('http://localhost:3000/')
  await page.waitForLoadState('networkidle')

  await browser.close()
}

export default globalSetup
