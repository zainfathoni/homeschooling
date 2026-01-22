import { expect, type Locator, type Page } from '@playwright/test'
import { format, startOfWeek } from 'date-fns'

export class NarrationPage {
  readonly page: Page
  readonly heading: Locator
  readonly textarea: Locator
  readonly submitButton: Locator
  readonly textTab: Locator
  readonly voiceTab: Locator
  readonly photoTab: Locator
  readonly backLink: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /Add Narration/i })
    this.textarea = page.getByPlaceholder(/Describe what you learned/i)
    this.submitButton = page.getByRole('button', { name: /Save Narration/i })
    this.textTab = page.getByRole('button', { name: /✏️ Text/i })
    this.voiceTab = page.getByRole('button', { name: /🎤 Voice/i })
    this.photoTab = page.getByRole('button', { name: /📷 Photo/i })
    this.backLink = page.getByRole('link', { name: /← Back/i })
  }

  /**
   * Navigate to new narration page for a subject.
   * Uses "reading" subject which has requiresNarration=true in curriculum.json.
   *
   * First navigates to /week to establish history, then to the narration page.
   * This ensures navigate(-1) after save has somewhere to go back to.
   */
  async gotoNewNarration() {
    // Get current week's Monday for the date
    const today = new Date()
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    const dateStr = format(monday, 'yyyy-MM-dd')

    // Use "reading" subject ID from curriculum.json (has requiresNarration=true)
    const subjectId = 'reading'

    // First navigate to /week to establish browser history
    // This ensures navigate(-1) after save has somewhere to go back to
    // Use catch for WebKit "about:blank" navigation interruption
    await this.page.goto('/week').catch(() => {})
    await this.page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/, { timeout: 15000 })
    await this.page.waitForLoadState('networkidle')

    // Navigate to the new narration page
    await this.page.goto(`/narration/new?subjectId=${subjectId}&date=${dateStr}`)
    await this.page.waitForLoadState('networkidle')
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible()
    await expect(this.textTab).toBeVisible()
  }

  async expectTextTabActive() {
    await expect(this.textTab).toHaveClass(/border-coral/)
    await expect(this.textarea).toBeVisible()
  }

  async clickTextTab() {
    await this.textTab.click()
  }

  async clickVoiceTab() {
    await this.voiceTab.click()
  }

  async clickPhotoTab() {
    await this.photoTab.click()
  }

  async expectVoiceTabActive() {
    await expect(this.voiceTab).toHaveClass(/border-coral/)
  }

  async expectPhotoTabActive() {
    await expect(this.photoTab).toHaveClass(/border-coral/)
  }

  async expectVoiceRecordingInterface() {
    await expect(this.page.getByRole('button', { name: /Start recording/i })).toBeVisible()
  }

  async expectPhotoUploadInterface() {
    await expect(this.page.getByRole('button', { name: /Upload photo from device/i })).toBeVisible()
  }

  async fillContent(content: string) {
    await this.textarea.fill(content)
  }

  async clearContent() {
    await this.textarea.clear()
  }

  async submit() {
    // Wait for both the click and the API response to complete
    // This ensures the form submission has finished before returning
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes('/api/save-narration') &&
          response.status() === 200
      ),
      this.submitButton.click(),
    ])
  }

  async expectSubmitEnabled() {
    await expect(this.submitButton).toBeEnabled()
    await expect(this.submitButton).not.toHaveClass(/cursor-not-allowed/)
  }

  async expectSubmitDisabled() {
    await expect(this.submitButton).toBeDisabled()
    await expect(this.submitButton).toHaveClass(/cursor-not-allowed/)
  }
}

export class NarrationViewPage {
  readonly page: Page
  readonly deleteButton: Locator
  readonly backLink: Locator
  readonly typeBadge: Locator

  constructor(page: Page) {
    this.page = page
    this.deleteButton = page.getByRole('button', { name: /Delete narration/i })
    this.backLink = page.getByRole('link', { name: /← Back/i })
    this.typeBadge = page.locator('.bg-lavender')
  }

  async expectLoaded() {
    await expect(this.deleteButton).toBeVisible()
    await expect(this.backLink).toBeVisible()
  }

  async expectContent(content: string) {
    await expect(this.page.getByText(content)).toBeVisible()
  }

  async expectTypeText() {
    await expect(this.page.getByText('text')).toBeVisible()
  }

  async delete() {
    // Wait for both the click and the action response to complete
    // This ensures the deletion has finished before returning
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes('/narration/') &&
          response.request().method() === 'POST' &&
          response.status() === 200
      ),
      this.deleteButton.click(),
    ])
  }
}
