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
   * Uses page script content to extract subject IDs from React Router hydration data.
   */
  async gotoNewNarration() {
    // Get current week's Monday for the date
    const today = new Date()
    const monday = startOfWeek(today, { weekStartsOn: 1 })
    const dateStr = format(monday, 'yyyy-MM-dd')
    const weekDateStr = format(monday, 'yyyy-MM-dd')

    // Navigate to weekly grid to get subject data
    await this.page.goto(`/week/${weekDateStr}`)
    await this.page.waitForLoadState('networkidle')

    // Give time for hydration
    await this.page.waitForTimeout(500)

    // Extract subject ID by looking at scripts for the hydration data
    const subjectId = await this.page.evaluate(() => {
      // Get all script tags
      const scripts = Array.from(document.querySelectorAll('script'))

      for (const script of scripts) {
        const text = script.textContent || ''

        // Look for the hydration data script which contains loader data
        // React Router uses JSON.parse with a specific pattern
        if (text.includes('staticRouterHydrationData')) {
          // The data is double-escaped JSON, need to carefully extract
          // Format: window.__staticRouterHydrationData = JSON.parse("...")

          // Find the JSON string content
          const jsonStart = text.indexOf('JSON.parse("') + 'JSON.parse("'.length
          const jsonEnd = text.lastIndexOf('")')

          if (jsonStart > 0 && jsonEnd > jsonStart) {
            let jsonStr = text.substring(jsonStart, jsonEnd)

            // Unescape the JSON string
            jsonStr = jsonStr
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\')

            try {
              const data = JSON.parse(jsonStr)

              // Navigate to loaderData to find entries with subjectId
              if (data?.loaderData) {
                for (const key of Object.keys(data.loaderData)) {
                  const loaderData = data.loaderData[key]
                  if (loaderData?.entries && Array.isArray(loaderData.entries)) {
                    // Find entry with requiresNarration
                    for (const entry of loaderData.entries) {
                      if (entry.requiresNarration && entry.subjectId) {
                        return entry.subjectId
                      }
                    }
                    // Fallback: return any subjectId if no requiresNarration found
                    // This allows tests to work even if the subject structure changes
                    if (loaderData.entries.length > 0 && loaderData.entries[0].subjectId) {
                      return loaderData.entries[0].subjectId
                    }
                  }
                }
              }
            } catch {
              // JSON parsing failed, try another approach
            }
          }
        }
      }

      // Fallback: simple regex on full HTML
      const html = document.documentElement.innerHTML
      // Look for pattern "subjectId":"c..." in various encodings
      const patterns = [
        /"subjectId":"(c[a-z0-9]+)"/i,
        /\\"subjectId\\":\\"(c[a-z0-9]+)\\"/i,
        /subjectId[^c]+(c[a-z0-9]{20,})/i,
      ]

      for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match && match[1]?.startsWith('c')) {
          return match[1]
        }
      }

      return null
    })

    if (!subjectId) {
      throw new Error('Could not find a subject ID from the page')
    }

    // Navigate to the new narration page
    await this.page.goto(`/narration/new?subjectId=${subjectId}&date=${dateStr}`)

    // Wait for page to load
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

  async fillContent(content: string) {
    await this.textarea.fill(content)
  }

  async clearContent() {
    await this.textarea.clear()
  }

  async submit() {
    await this.submitButton.click()
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
    await this.deleteButton.click()
  }
}
