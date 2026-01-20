import { expect, type Locator, type Page } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly heading: Locator
  readonly emailInput: Locator
  readonly submitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Welcome to Homeschool Planner' })
    this.emailInput = page.getByLabel(/email/i)
    this.submitButton = page.getByRole('button', { name: /send magic link/i })
  }

  async goto() {
    await this.page.goto('/login')
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible()
    await expect(this.emailInput).toBeVisible()
    await expect(this.submitButton).toBeVisible()
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email)
  }

  async submit() {
    await this.submitButton.click()
  }
}
