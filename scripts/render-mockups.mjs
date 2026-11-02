#!/usr/bin/env node
/**
 * Render docs/design/mockups-v2.html into light/dark PNG boards.
 * Uses Playwright's bundled Chromium when present, otherwise the installed Google Chrome.
 * One-time setup on a new machine: `pnpm exec playwright install chromium`.
 */
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = pathToFileURL(join(root, 'docs/design/mockups-v2.html')).href
const out = join(root, 'docs/design/mockups-v2')

const boards = [
  { name: 'settings', width: 840 },
  { name: 'menu', width: 416 },
  { name: 'quick', width: 416 },
  { name: 'composer', width: 776 },
  { name: 'feedback', width: 776 },
]
const themes = ['light', 'dark']

await mkdir(out, { recursive: true })

let browser
try {
  browser = await chromium.launch()
} catch (reason) {
  console.warn(`bundled Chromium unavailable (${reason.message.split('\n')[0]}); falling back to Google Chrome`)
  browser = await chromium.launch({ channel: 'chrome' })
}

try {
  for (const theme of themes) {
    for (const board of boards) {
      const page = await browser.newPage({ viewport: { width: board.width, height: 900 }, deviceScaleFactor: 2 })
      await page.goto(`${source}?board=${board.name}&theme=${theme}`)
      await page.evaluate(() => document.fonts.ready.then(() => true))
      await page.locator('.stage').screenshot({ path: join(out, `${board.name}-${theme}.png`) })
      console.log(`${board.name}-${theme}.png`)
      await page.close()
    }
  }
} finally {
  await browser.close()
}
