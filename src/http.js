export async function fetchJson(url, options = {}, fetchImpl = fetch) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 7000)
  try {
    const response = await fetchImpl(url, { ...options, signal: controller.signal })
    const text = await response.text()
    let data = null
    try { data = text ? JSON.parse(text) : null } catch {}
    return { ok: response.ok, status: response.status, data, text }
  } finally {
    clearTimeout(timeout)
  }
}
