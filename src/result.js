export const STATUS = Object.freeze({
  PASS: 'PASS',
  WARN: 'WARN',
  FAIL: 'FAIL',
  UNKNOWN: 'UNKNOWN',
})

export function result(id, status, title, detail, fix, meta = {}) {
  return { id, status, title, detail, fix, ...meta }
}
