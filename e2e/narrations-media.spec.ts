import { test, expect } from './base-test'
import { NarrationPage } from './pages/narration.page'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * E2E tests for voice and photo narration flows.
 * Tests tab switching, recording interface, and photo upload.
 *
 * Usage:
 *   npm run test:e2e -- narrations-media.spec.ts
 */

test.use({
  storageState: 'e2e/fixtures/auth/parent.local.json',
})

test.describe('Voice narration - Tab behavior', () => {
  test('can switch to voice tab and see recording interface', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for tab switching')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    await narrationPage.clickVoiceTab()
    await narrationPage.expectVoiceTabActive()
    await narrationPage.expectVoiceRecordingInterface()
  })

  test('voice tab shows microphone button in idle state', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for tab switching')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    await narrationPage.clickVoiceTab()

    const startRecordingButton = page.getByRole('button', { name: /Start recording/i })
    await expect(startRecordingButton).toBeVisible()
    await expect(startRecordingButton).toBeEnabled()
  })
})

test.describe('Photo narration - Tab behavior', () => {
  test('can switch to photo tab and see upload interface', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for tab switching')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    await narrationPage.clickPhotoTab()
    await narrationPage.expectPhotoTabActive()
    await narrationPage.expectPhotoUploadInterface()
  })

  test('photo tab shows camera and upload buttons', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for tab switching')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    await narrationPage.clickPhotoTab()

    const uploadButton = page.getByRole('button', { name: /Upload photo from device/i })
    await expect(uploadButton).toBeVisible()
    await expect(uploadButton).toBeEnabled()
  })

  test('photo tab shows helper text', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for tab switching')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    await narrationPage.clickPhotoTab()

    await expect(page.getByText(/Take a photo or upload from your device/i)).toBeVisible()
  })
})

test.describe('Photo narration - Upload flow', () => {
  const testImagePath = path.join(__dirname, 'fixtures', 'test-image.png')

  test('can upload a photo via file input', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for file upload')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    await narrationPage.clickPhotoTab()

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)

    const preview = page.locator('img[alt="Captured photo preview"]')
    await expect(preview).toBeVisible()

    const saveButton = page.getByRole('button', { name: /Save Narration/i })
    await expect(saveButton).toBeVisible()
    await expect(saveButton).toBeEnabled()
  })

  test('shows preview after uploading photo', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for file upload')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    await narrationPage.clickPhotoTab()

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)

    await expect(page.locator('img[alt="Captured photo preview"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Discard and retake photo/i })).toBeVisible()
  })

  test('can discard uploaded photo and return to idle state', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for file upload')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    await narrationPage.clickPhotoTab()

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)

    await expect(page.locator('img[alt="Captured photo preview"]')).toBeVisible()

    const discardButton = page.getByRole('button', { name: /Discard and retake photo/i })
    await discardButton.click()

    await expect(page.locator('img[alt="Captured photo preview"]')).not.toBeVisible()
    await expect(page.getByRole('button', { name: /Upload photo from device/i })).toBeVisible()
  })
})

test.describe('Tab switching - State persistence', () => {
  test('switching between tabs changes active tab styling', async ({ page, noscript }) => {
    test.skip(noscript, 'Requires JavaScript for tab switching')
    const narrationPage = new NarrationPage(page)
    await narrationPage.gotoNewNarration()
    await narrationPage.expectLoaded()

    await narrationPage.expectTextTabActive()

    await narrationPage.clickVoiceTab()
    await narrationPage.expectVoiceTabActive()
    await expect(narrationPage.textTab).not.toHaveClass(/border-coral/)

    await narrationPage.clickPhotoTab()
    await narrationPage.expectPhotoTabActive()
    await expect(narrationPage.voiceTab).not.toHaveClass(/border-coral/)

    await narrationPage.clickTextTab()
    await narrationPage.expectTextTabActive()
    await expect(narrationPage.photoTab).not.toHaveClass(/border-coral/)
  })
})
