import { build } from 'esbuild'
import { chromium, expect } from '@playwright/test'
import { createServer } from 'node:http'
import { mkdir } from 'node:fs/promises'

const out = 'docs/design/v4-screenshots'
await mkdir(out, { recursive: true })
const bundle = await build({ entryPoints: ['tests/support/settings-fixture.tsx'], bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic', target: 'es2022' })
const html = `<!doctype html><html lang="zh"><meta charset="utf-8"><title>Input assistant settings fixture</title>
<style>body{margin:0;background:#ececeb;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Segoe UI",sans-serif}body[data-ds-dark-theme]{background:#141415}.frame{width:880px;padding:28px;box-sizing:border-box}.panel{width:784px;padding:28px 32px;background:#fff;border-radius:16px;box-shadow:0 0 0 .5px rgba(0,0,0,.06),0 12px 32px rgba(0,0,0,.10);box-sizing:border-box}body[data-ds-dark-theme] .panel{background:#232324}#root{width:720px}</style>
<style id="styles"></style><div class="frame"><div class="panel"><div id="root"></div></div></div><script src="/fixture.js"></script></html>`
const server = createServer((request, response) => {
  response.setHeader('Content-Type', request.url === '/fixture.js' ? 'text/javascript;charset=utf-8' : 'text/html;charset=utf-8')
  response.end(request.url === '/fixture.js' ? bundle.outputFiles[0].text : html)
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
let browser
const assertions = []
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage({ viewport: { width: 880, height: 1000 } })
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${port}`)
  await expect(page.getByRole('form', { name: '输入助手设置' })).toBeVisible()
  await page.getByText('正在加载设置…').waitFor({ state: 'detached' }).catch(() => {})
  await expect(page.getByRole('form', { name: '输入助手设置' })).toBeVisible()
  await page.screenshot({ path: `${out}/settings-light.png`, fullPage: true })
  assertions.push('light default rendered')
  await page.evaluate(() => window.fixture.setDark(true))
  await page.screenshot({ path: `${out}/settings-dark.png`, fullPage: true })
  assertions.push('dark rendered')
  await page.evaluate(() => window.fixture.setDark(false))
  await page.getByRole('button', { name: /高级设置/ }).click()
  await expect(page.getByRole('spinbutton', { name: '温度', exact: true })).toBeVisible()
  await page.screenshot({ path: `${out}/settings-advanced-light.png`, fullPage: true })
  assertions.push('advanced expanded')
  await page.getByRole('button', { name: /高级设置/ }).click()
  await page.getByRole('button', { name: '说明: 建议长度' }).click()
  await expect(page.getByRole('tooltip')).toBeVisible()
  await page.screenshot({ path: `${out}/settings-tooltip-light.png`, fullPage: true })
  assertions.push('info tooltip')
  await page.evaluate(() => window.fixture.setDark(true))
  await page.screenshot({ path: `${out}/settings-tooltip-dark.png`, fullPage: true })
  await page.evaluate(() => window.fixture.setDark(false))
  await page.getByRole('button', { name: '说明: 建议长度' }).click()
  await page.getByRole('button', { name: '关于' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `${out}/about-light.png` })
  await page.evaluate(() => window.fixture.setDark(true))
  await page.screenshot({ path: `${out}/about-dark.png` })
  await page.evaluate(() => window.fixture.setDark(false))
  assertions.push('about dialog light and dark')
  await page.getByRole('button', { name: '关闭' }).click()
  const english = await browser.newPage({ viewport: { width: 880, height: 1000 } })
  const englishErrors = []; english.on('pageerror', error => englishErrors.push(error.message))
  await english.goto(`http://127.0.0.1:${port}?lang=en`)
  await expect(english.getByRole('form', { name: 'Input assistant settings' })).toBeVisible()
  await english.screenshot({ path: `${out}/settings-en-light.png`, fullPage: true })
  assertions.push('english rendered')
  const narrow = await browser.newPage({ viewport: { width: 720, height: 1000 } })
  const narrowErrors = []; narrow.on('pageerror', error => narrowErrors.push(error.message))
  await narrow.goto(`http://127.0.0.1:${port}`)
  await narrow.evaluate(() => {
    const frame = document.querySelector('.frame'); const panel = document.querySelector('.panel'); const root = document.querySelector('#root')
    if (frame) frame.style.width = '720px'
    if (panel) { panel.style.width = '100%'; panel.style.padding = '24px 20px' }
    if (root) root.style.width = '100%'
  })
  await narrow.getByRole('form', { name: '输入助手设置' }).waitFor()
  await narrow.screenshot({ path: `${out}/settings-narrow.png`, fullPage: true })
  const overflow = await narrow.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
  assertions.push('narrow 720 no horizontal scroll')
  const zoom = await browser.newPage({ viewport: { width: 640, height: 1000 } })
  const zoomErrors = []; zoom.on('pageerror', error => zoomErrors.push(error.message))
  await zoom.goto(`http://127.0.0.1:${port}`)
  await zoom.evaluate(() => {
    const frame = document.querySelector('.frame'); const panel = document.querySelector('.panel'); const root = document.querySelector('#root')
    if (frame) frame.style.width = '640px'
    if (panel) { panel.style.width = '100%'; panel.style.padding = '24px 20px' }
    if (root) root.style.width = '100%'
  })
  await zoom.getByRole('form', { name: '输入助手设置' }).waitFor()
  const zoomOverflow = await zoom.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(zoomOverflow).toBe(false)
  await zoom.screenshot({ path: `${out}/settings-200.png`, fullPage: true })
  await zoom.setViewportSize({ width: 360, height: 1000 })
  await zoom.evaluate(() => {
    const frame = document.querySelector('.frame'); const panel = document.querySelector('.panel'); const root = document.querySelector('#root')
    if (frame) frame.style.width = '360px'
    if (panel) { panel.style.width = '100%'; panel.style.padding = '20px 16px' }
    if (root) root.style.width = '100%'
  })
  await zoom.evaluate(() => document.querySelector('button[aria-label="说明: 建议长度"]')?.click())
  await expect(zoom.getByRole('tooltip')).toBeVisible()
  await zoom.screenshot({ path: `${out}/settings-200-tooltip.png` })
  const tooltipBox = await zoom.getByRole('tooltip').boundingBox()
  expect(tooltipBox && tooltipBox.x >= 0 && tooltipBox.x + tooltipBox.width <= 360).toBe(true)
  const zoomNarrowOverflow = await zoom.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(zoomNarrowOverflow).toBe(false)
  assertions.push('200% equivalent 640/360 no horizontal scroll; tooltip stays in viewport')
  expect([...errors, ...englishErrors, ...narrowErrors, ...zoomErrors]).toEqual([])
  console.log(JSON.stringify({ status: 'passed', assertions, realDshDesktop: false }, null, 2))
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)) }
