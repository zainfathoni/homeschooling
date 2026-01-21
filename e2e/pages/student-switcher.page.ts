import { expect, type Locator, type Page } from '@playwright/test'

export class StudentSwitcherPage {
  readonly page: Page
  readonly switcher: Locator
  readonly viewingAsLabel: Locator

  constructor(page: Page) {
    this.page = page
    this.switcher = page.getByLabel('Select student')
    this.viewingAsLabel = page.getByText('Viewing as')
  }

  async goto() {
    await this.page.goto('/week')
    await this.page.waitForLoadState('networkidle')
  }

  async expectSwitcherVisible() {
    await expect(this.viewingAsLabel).toBeVisible()
    await expect(this.switcher).toBeVisible()
  }

  async expectSwitcherNotVisible() {
    await expect(this.switcher).not.toBeVisible()
  }

  async expectSingleStudentDisplay(studentName: string) {
    await expect(this.page.getByText(studentName)).toBeVisible()
    await expect(this.switcher).not.toBeVisible()
  }

  async getSelectedStudent(): Promise<string> {
    return await this.switcher.inputValue()
  }

  async getStudentOptions(): Promise<string[]> {
    const options = await this.switcher.locator('option').allTextContents()
    return options
  }

  async selectStudent(studentName: string) {
    // Wait for the API response that sets the cookie
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/select-student') && response.status() === 200
    )
    await this.switcher.selectOption({ label: studentName })
    await responsePromise
    // Reload to ensure the new cookie is used (WebKit on Linux doesn't revalidate properly)
    await this.page.reload()
    await this.page.waitForLoadState('networkidle')
  }

  async expectStudentSelected(studentName: string) {
    // The select should show the selected student's name
    const selectedOption = await this.switcher.inputValue()
    const optionText = await this.switcher.locator(`option[value="${selectedOption}"]`).textContent()
    expect(optionText).toBe(studentName)
  }

  async expectHeadingContains(text: string) {
    // The UI shows "Viewing: {studentName}" in a span, not in a heading
    await expect(this.page.getByText(new RegExp(`Viewing:\\s*${text}`, 'i'))).toBeVisible()
  }
}
