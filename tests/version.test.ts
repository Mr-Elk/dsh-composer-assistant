import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PLUGIN_NAME, PLUGIN_VERSION } from '../src/core'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { name: string; version: string }

describe('package identity', () => {
  it('keeps the runtime identity in sync with package.json', () => {
    expect(PLUGIN_NAME).toBe(pkg.name)
    expect(PLUGIN_VERSION).toBe(pkg.version)
    expect(pkg.name).toBe('dsh-composer-assistant')
  })
})
