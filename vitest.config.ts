import { defineConfig } from 'vitest/config'
export default defineConfig({ test: {
  include: ['tests/**/*.test.{ts,tsx}'],
  exclude: ['**/._*'],
  environment: 'node',
  setupFiles: ['tests/support/setup-storage.ts'],
  testTimeout: 15000,
  restoreMocks: true,
} })
