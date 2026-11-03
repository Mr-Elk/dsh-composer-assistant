import { afterAll } from 'vitest'

// Vitest exposes the active JSDOM instance after initializing the environment.
// Node's own storage globals can prevent Vitest 3 from copying these properties.
const { jsdom } = globalThis as typeof globalThis & { jsdom?: { window: Window } }

// VM pools already run directly in the jsdom window; do not replace its getters.
if (jsdom && jsdom.window !== globalThis.window) {
  const storageNames = ['localStorage', 'sessionStorage'] as const
  const originals = storageNames.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const)

  for (const name of storageNames) {
    Object.defineProperty(globalThis, name, {
      get: () => jsdom.window[name],
      configurable: true,
      enumerable: true,
    })
  }

  // Vitest does not restore globals that its environment skipped. Restore them
  // here too, so this setup is safe when files share a worker (--no-isolate).
  afterAll(() => {
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else Reflect.deleteProperty(globalThis, name)
    }
  })
}
