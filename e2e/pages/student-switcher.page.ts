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
    await this.switcher.selectOption({ label: studentName })
    await this.page.waitForLoadState('networkidle')
  }

  async expectStudentSelected(studentName: string) {
    await expect(this.switcher).toContainText(studentName)
  }

  async expectHeadingContains(text: string) {
    await expect(this.page.getByRole('heading', { name: new RegExp(text, 'i') })).toBeVisible()
  }
}
