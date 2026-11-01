/** Package identity used by the update check; kept in sync with package.json by a test. */
export const PLUGIN_NAME = 'dsh-composer-assistant'
export const PLUGIN_VERSION = '0.2.0'
export const PACKAGE_URL = `https://www.npmjs.com/package/${PLUGIN_NAME}`

export interface UpdateCheckResult {
  current: string
  latest: string | null
  url: string
  error: string | null
}

/** Compare two semver strings; prereleases sort before their release. */
export function compareVersions(left: string, right: string): number {
  const parse = (value: string): { numbers: number[]; prerelease: string[] } => {
    const [core, ...rest] = value.trim().replace(/^v/u, '').split('-')
    const numbers = core.split('.').map(part => {
      const parsed = Number.parseInt(part, 10)
      return Number.isFinite(parsed) ? parsed : 0
    })
    while (numbers.length < 3) numbers.push(0)
    return { numbers, prerelease: rest.length ? rest.join('-').split('.') : [] }
  }
  const a = parse(left), b = parse(right)
  for (let index = 0; index < 3; index += 1) {
    if (a.numbers[index] !== b.numbers[index]) return a.numbers[index] > b.numbers[index] ? 1 : -1
  }
  if (!a.prerelease.length && !b.prerelease.length) return 0
  if (!a.prerelease.length) return 1
  if (!b.prerelease.length) return -1
  const length = Math.max(a.prerelease.length, b.prerelease.length)
  for (let index = 0; index < length; index += 1) {
    const leftId = a.prerelease[index], rightId = b.prerelease[index]
    if (leftId === undefined) return -1
    if (rightId === undefined) return 1
    const leftNumber = /^\d+$/u.test(leftId) ? Number(leftId) : null
    const rightNumber = /^\d+$/u.test(rightId) ? Number(rightId) : null
    if (leftNumber !== null && rightNumber !== null) {
      if (leftNumber !== rightNumber) return leftNumber > rightNumber ? 1 : -1
      continue
    }
    if (leftNumber !== null) return -1
    if (rightNumber !== null) return 1
    if (leftId !== rightId) return leftId > rightId ? 1 : -1
  }
  return 0
}
