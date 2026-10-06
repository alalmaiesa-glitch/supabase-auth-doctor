const ICON = { PASS: '✓', WARN: '!', FAIL: '✗', UNKNOWN: '?' }
const COLOR = {
  PASS: '\x1b[32m',
  WARN: '\x1b[33m',
  FAIL: '\x1b[31m',
  UNKNOWN: '\x1b[90m',
}
const RESET = '\x1b[0m'

export function summarize(results) {
  return results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1
    return acc
  }, { PASS: 0, WARN: 0, FAIL: 0, UNKNOWN: 0 })
}

export function renderText(results, { color = process.stdout.isTTY } = {}) {
  const lines = ['Supabase Auth Doctor', '']
  for (const item of results) {
    const prefix = `${ICON[item.status]} ${item.status}`
    const label = color ? `${COLOR[item.status]}${prefix}${RESET}` : prefix
    lines.push(`${label}  ${item.title}`)
    if (item.detail) lines.push(`    ${item.detail}`)
    if (item.fix) lines.push(`    FIX: ${item.fix}`)
  }
  const summary = summarize(results)
  lines.push('', `${summary.FAIL} failure(s), ${summary.WARN} warning(s), ${summary.UNKNOWN} unknown, ${summary.PASS} passed`)
  return lines.join('\n')
}

export function renderJson(results, context = {}) {
  return JSON.stringify({ results, summary: summarize(results), context }, null, 2)
}
