export function splitAllowList(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String).map((x) => x.trim()).filter(Boolean)
  return String(value).split(',').map((x) => x.trim()).filter(Boolean)
}

export function supabaseGlobToRegExp(pattern) {
  let out = '^'
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i]
    const next = pattern[i + 1]
    if (c === '*' && next === '*') {
      out += '.*'
      i += 1
    } else if (c === '*') {
      out += '[^./]*'
    } else if (c === '?') {
      out += '[^./]'
    } else {
      out += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
  }
  out += '$'
  return new RegExp(out)
}

export function isAllowedRedirect(target, allowList) {
  return allowList.some((pattern) => {
    try {
      return supabaseGlobToRegExp(pattern).test(target)
    } catch {
      return pattern === target
    }
  })
}
