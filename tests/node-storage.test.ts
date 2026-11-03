// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { expect, it } from 'vitest'

it('leaves storage globals in Node tests as provided by the current Node runtime', () => {
  // Inspect descriptors without invoking Node's localStorage getter or opening a file.
  const inspect = `JSON.stringify(['localStorage', 'sessionStorage'].map(name => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name)
    return descriptor ? { ...descriptor, get: String(descriptor.get), set: String(descriptor.set) } : null
  }))`
  const native = execFileSync(process.execPath, [...process.execArgv, '-p', inspect], { encoding: 'utf8' })
  const actual = ['localStorage', 'sessionStorage'].map(name => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name)
    return descriptor ? { ...descriptor, get: String(descriptor.get), set: String(descriptor.set) } : null
  })
  expect(actual).toEqual(JSON.parse(native))
})
