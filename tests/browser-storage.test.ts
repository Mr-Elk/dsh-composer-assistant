// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'

const storageNames = ['localStorage', 'sessionStorage'] as const
const jsdomWindow = (globalThis as typeof globalThis & { jsdom: { window: Window } }).jsdom.window

afterEach(() => {
  for (const name of storageNames) jsdomWindow[name].clear()
})

describe.each(storageNames)('%s in the browser test environment', name => {
  it('uses the current jsdom window storage through every browser global', () => {
    expect(globalThis[name]).toBe(jsdomWindow[name])
    expect(window[name]).toBe(jsdomWindow[name])
    expect(globalThis[name]).toBeInstanceOf(Storage)
  })

  it('preserves browser storage methods, key conversion and named properties', () => {
    const storage = globalThis[name]
    storage.setItem(7 as unknown as string, 42 as unknown as string)
    expect(storage.getItem('7')).toBe('42')
    expect(storage['7']).toBe('42')
    expect(storage.length).toBe(1)
    expect(storage.key(0)).toBe('7')
    expect(storage.key(1)).toBeNull()
    storage.removeItem('7')
    expect(storage.getItem('7')).toBeNull()
    storage.named = 'browser value'
    expect(storage.getItem('named')).toBe('browser value')
    storage.clear()
    expect(storage.length).toBe(0)
    expect(storage.key(0)).toBeNull()
  })
})

it('keeps local and session storage separate', () => {
  localStorage.setItem('scope', 'local')
  sessionStorage.setItem('scope', 'session')
  expect(localStorage.getItem('scope')).toBe('local')
  expect(sessionStorage.getItem('scope')).toBe('session')
  localStorage.clear()
  expect(sessionStorage.getItem('scope')).toBe('session')
})
