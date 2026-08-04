import { expect, test } from '@playwright/test'

test.describe('KeyMaster smoke', () => {
  test('home hero and nav links', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/горячие клавиши|Hotkeys/i)
    await expect(page.getByRole('link', { name: 'Курсы' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Рейтинг' })).toBeVisible()
  })

  test('courses catalog loads cards', async ({ page }) => {
    await page.goto('/courses')
    await expect(page.getByRole('heading', { name: /Каталог курсов/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Основные горячие клавиши программиста/i })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('leaderboard period toggle and podium', async ({ page }) => {
    await page.goto('/leaderboard')
    await expect(page.getByRole('heading', { name: 'Рейтинг' })).toBeVisible()
    await expect(page.getByRole('group', { name: /Период рейтинга/i })).toBeVisible()
    await page.getByRole('button', { name: 'Неделя' }).click()
    await expect(page.getByRole('button', { name: 'Неделя' })).toBeVisible()
  })

  test('login form accessible', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible()
  })

  test('review page loads', async ({ page }) => {
    await page.goto('/review')
    await expect(page.getByRole('heading', { name: /Повторение/i })).toBeVisible()
  })
})
