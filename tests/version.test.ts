import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PLUGIN_NAME, PLUGIN_VERSION, compareVersions } from '../src/core'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { name: string; version: string }

describe('package identity and version comparison', () => {
  it('keeps the runtime identity in sync with package.json', () => {
    expect(PLUGIN_NAME).toBe(pkg.name)
    expect(PLUGIN_VERSION).toBe(pkg.version)
    expect(pkg.name).toBe('dsh-composer-assistant')
  })
  it('orders releases, prereleases and build suffixes', () => {
    expect(compareVersions('0.2.1', '0.2.0')).toBe(1)
    expect(compareVersions('0.2.0', '0.2.0')).toBe(0)
    expect(compareVersions('0.10.0', '0.9.9')).toBe(1)
    expect(compareVersions('1.0.0', '1.0.0-rc.2')).toBe(1)
    expect(compareVersions('1.0.0-rc.2', '1.0.0-rc.10')).toBe(-1)
    expect(compareVersions('v1.2.3', '1.2.3')).toBe(0)
  })
})
