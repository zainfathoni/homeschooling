import { expect, type Locator, type Page } from '@playwright/test'

export class DailyFocusPage {
  readonly page: Page
  readonly duetContainer: Locator
  readonly weeklyOverviewPanel: Locator
  readonly dailyFocusPanel: Locator
  readonly progressRing: Locator
  readonly tasksCompleteText: Locator

  constructor(page: Page) {
    this.page = page
    // Duet view container - visible only on md+ viewports
    this.duetContainer = page.locator('.md\\:grid.md\\:grid-cols-2')
    // Left panel with weekly overview
    this.weeklyOverviewPanel = this.duetContainer.locator('div').filter({ hasText: 'Weekly Overview' }).first()
    // Right panel with daily focus (inside duet container)
    this.dailyFocusPanel = this.duetContainer.locator('.bg-white.rounded-xl.shadow-sm.p-6')
    // Progress ring SVG (inside daily focus panel)
    this.progressRing = this.dailyFocusPanel.locator('svg circle').first()
    // Task completion text like "X of Y tasks complete"
    this.tasksCompleteText = this.dailyFocusPanel.getByText(/\d+ of \d+ tasks complete/)
  }

  async goto(weekDate?: string) {
    // Use legacy route which redirects to nested /students/:studentId/week/:weekStart
    const path = weekDate ? `/week/${weekDate}` : '/week'
    await this.page.goto(path)
    // Wait for redirect to complete
    await this.page.waitForURL(/\/students\/[^/]+\/week\/\d{4}-\d{2}-\d{2}/)
    await this.page.waitForLoadState('networkidle')
  }

  getStudentIdFromUrl(): string | null {
    const match = this.page.url().match(/\/students\/([^/]+)\//)
    return match ? match[1] : null
  }

  async expectDuetViewVisible() {
    await expect(this.duetContainer).toBeVisible()
    await expect(this.weeklyOverviewPanel).toBeVisible()
    await expect(this.dailyFocusPanel).toBeVisible()
  }

  async expectDuetViewHidden() {
    await expect(this.duetContainer).toBeHidden()
  }

  getDayButton(dayName: string): Locator {
    // Day buttons are in the weekly overview panel (left side of duet)
    return this.weeklyOverviewPanel.getByRole('button', { name: dayName })
  }

  getTodayBadge(): Locator {
    return this.weeklyOverviewPanel.getByText('Today').first()
  }

  async selectDay(dayName: string) {
    const dayButton = this.getDayButton(dayName)
    // Wait for button to be enabled before clicking
    await expect(dayButton).toBeEnabled({ timeout: 5000 })
    await dayButton.click()
  }

  async expectDaySelected(dayName: string) {
    // Selected day has ring-2 ring-coral styling
    const dayButton = this.getDayButton(dayName)
    await expect(dayButton).toHaveClass(/ring-2/)
  }

  async expectDailyFocusHeading(dayName: string) {
    // DailyFocus shows full day name (e.g., "Monday") as heading
    await expect(this.dailyFocusPanel.getByRole('heading', { name: dayName })).toBeVisible()
  }

  getTaskCard(subjectName: string): Locator {
    // Task cards have subject name in a span and a toggle button
    // Match the task row div that contains both the subject name and the toggle button
    return this.dailyFocusPanel.locator('div.flex.items-center.gap-3').filter({ hasText: subjectName })
  }

  getTaskToggleButton(subjectName: string): Locator {
    const taskCard = this.getTaskCard(subjectName)
    // There's exactly one button per task card
    return taskCard.getByRole('button', { name: /Mark/ })
  }

  async expectTaskComplete(subjectName: string) {
    await expect(this.getTaskToggleButton(subjectName)).toHaveAttribute('aria-label', 'Mark incomplete')
  }

  async expectTaskIncomplete(subjectName: string) {
    await expect(this.getTaskToggleButton(subjectName)).toHaveAttribute('aria-label', 'Mark complete')
  }

  async toggleTask(subjectName: string) {
    const button = this.getTaskToggleButton(subjectName)
    const wasComplete = (await button.getAttribute('aria-label')) === 'Mark incomplete'
    
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes('/api/toggle-completion') &&
          response.status() === 200
      ),
      button.click(),
    ])
    
    // Wait for UI to update
    const expectedLabel = wasComplete ? 'Mark complete' : 'Mark incomplete'
    await expect(button).toHaveAttribute('aria-label', expectedLabel)
  }

  async getProgressPercentage(): Promise<number> {
    const text = await this.tasksCompleteText.textContent()
    const match = text?.match(/(\d+) of (\d+)/)
    if (match) {
      const completed = parseInt(match[1])
      const total = parseInt(match[2])
      return total > 0 ? Math.round((completed / total) * 100) : 0
    }
    return 0
  }

  async expectProgressRingVisible() {
    await expect(this.page.locator('svg').filter({ has: this.page.locator('circle') }).first()).toBeVisible()
  }

  getNarrationLink(subjectName: string): Locator {
    const taskCard = this.getTaskCard(subjectName)
    return taskCard.getByRole('link', { name: /narration/i })
  }

  async expectNarrationButtonState(subjectName: string, state: 'add' | 'view') {
    const link = this.getNarrationLink(subjectName)
    if (state === 'add') {
      await expect(link).toHaveText('Add narration')
    } else {
      await expect(link).toHaveText('View narration')
    }
  }
}
