import { test, expect, Page } from '@playwright/test'

const keys = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72]

const waitSetupSoundFont2Synth = async (page: Page) => {
  await page.getByTestId(`key-${keys[0]}-button`).click()
}

test('start button should be visible and enabled', async ({ page }) => {
  await page.goto('/')

  const startButton = await page.getByTestId('start-button')

  await expect(startButton).toBeVisible()
  await expect(startButton).toBeEnabled()
})

test('start button should be visible and disabled after the start', async ({
  page,
}) => {
  await page.goto('/')

  const startButton = await page.getByTestId('start-button')
  await startButton.click()

  await waitSetupSoundFont2Synth(page)

  await expect(startButton).toBeVisible()
  await expect(startButton).toBeDisabled()
})

test('key buttons should be visible and disabled', async ({ page }) => {
  await page.goto('/')

  for (const key of keys) {
    const keyButton = await page.getByTestId(`key-${key}-button`)

    await expect(keyButton).toBeVisible()
    await expect(keyButton).toBeDisabled()
  }
})

test('key buttons should be visible and enabled after the start', async ({
  page,
}) => {
  await page.goto('/')

  await page.getByTestId('start-button').click()
  await waitSetupSoundFont2Synth(page)

  for (const key of keys) {
    const keyButton = await page.getByTestId(`key-${key}-button`)

    await expect(keyButton).toBeVisible()
    await expect(keyButton).toBeEnabled()
  }
})
