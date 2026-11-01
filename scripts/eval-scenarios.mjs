#!/usr/bin/env node
/** Validate the fixed quality scenarios: shape, coverage and uniqueness. */
import { readFile } from 'node:fs/promises'

const path = new URL('../evaluation/scenarios/core.json', import.meta.url)
const document = JSON.parse(await readFile(path, 'utf8'))
const problems = []
const scenarios = Array.isArray(document.scenarios) ? document.scenarios : []
if (scenarios.length !== 12) problems.push(`期望 12 条场景，实际 ${scenarios.length}`)
const counts = { optimize: 0, next: 0, complete: 0 }
const ids = new Set()
for (const item of scenarios) {
  if (!item.id || ids.has(item.id)) problems.push(`场景 id 缺失或重复：${item.id}`)
  ids.add(item.id)
  if (!(item.operation in counts)) problems.push(`${item.id} 的 operation 无效：${item.operation}`)
  else counts[item.operation] += 1
  if (!item.setup || !item.expect?.length) problems.push(`${item.id} 缺少 setup 或 expect`)
  if (!item.fail?.length) problems.push(`${item.id} 缺少 fail 反例`)
}
for (const [operation, count] of Object.entries(counts)) {
  if (count !== 4) problems.push(`${operation} 应有 4 条，实际 ${count}`)
}
if (problems.length) {
  process.stderr.write(problems.map(problem => `  - ${problem}`).join('\n') + '\n')
  process.exit(1)
}
process.stdout.write(`scenarios OK: 12 条（optimize/next/complete 各 4），${ids.size} 个唯一 id\n`)
