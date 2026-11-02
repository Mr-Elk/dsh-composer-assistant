#!/usr/bin/env node
/**
 * Render docs/design/mockups-v3.html into light/dark PNG boards.
 * Uses Playwright's bundled Chromium when present, otherwise the installed Google Chrome.
 */
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = pathToFileURL(join(root, 'docs/design/mockups-v3.html')).href
const out = join(root, 'docs/design/mockups-v3')

const boards = [
  { name: 'settings', board: 'settings', width: 840 },
  { name: 'settings-hover', board: 'settingsHover', width: 840 },
  { name: 'composer', board: 'composer', width: 776 },
  { name: 'popover', board: 'popover', width: 396 },
  { name: 'popover-hover', board: 'popoverHover', width: 700 },
  { name: 'context', board: 'context', width: 776 },
  { name: 'first-run', board: 'firstRun', width: 776 },
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
      const page = await browser.newPage({ viewport: { width: board.width, height: 800 }, deviceScaleFactor: 2 })
      await page.goto(`${source}?board=${board.board}&theme=${theme}`)
      await page.evaluate(() => document.fonts.ready.then(() => true))
      await page.locator('.stage').screenshot({ path: join(out, `${board.name}-${theme}.png`) })
      console.log(`${board.name}-${theme}.png`)
      await page.close()
    }
  }
} finally {
  await browser.close()
}
