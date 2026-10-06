export function normalizeBaseUrl(value) {
  if (!value) return null
  const raw = value.trim()
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  const url = new URL(withScheme)
  url.pathname = url.pathname.replace(/\/+$/, '') || '/'
  url.search = ''
  url.hash = ''
  return url.toString().replace(/\/$/, '')
}

export function deriveProjectRef(baseUrl) {
  try {
    const host = new URL(baseUrl).hostname
    const match = host.match(/^([a-z0-9-]+)\.supabase\.co$/i)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

export function callbackUrl(baseUrl) {
  return `${normalizeBaseUrl(baseUrl)}/auth/v1/callback`
}

export function settingsUrl(baseUrl) {
  return `${normalizeBaseUrl(baseUrl)}/auth/v1/settings`
}

export function isLocalhostUrl(value) {
  try {
    const u = new URL(/^https?:\/\//i.test(value) ? value : `http://${value}`)
    return ['localhost', '127.0.0.1', '::1'].includes(u.hostname)
  } catch {
    return false
  }
}

export function decodeJwtPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const body = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = body.padEnd(Math.ceil(body.length / 4) * 4, '=')
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'))
  } catch {
    return null
  }
}

export function looksLikeSecretKey(key) {
  if (!key) return false
  if (key.startsWith('sb_secret_')) return true
  const payload = decodeJwtPayload(key)
  return payload?.role === 'service_role'
}
