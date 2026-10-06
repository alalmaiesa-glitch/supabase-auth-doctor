import { STATUS, result } from '../result.js'
import { fetchJson } from '../http.js'
import { splitAllowList, isAllowedRedirect } from '../glob.js'
import { normalizeBaseUrl } from '../project.js'

export async function inspectManagement(context, scan, fetchImpl = fetch) {
  const results = []
  if (!context.managementToken || !context.projectRef) {
    results.push(result('management.auth-config', STATUS.UNKNOWN, 'Dashboard Auth config not checked', 'SUPABASE_ACCESS_TOKEN and project ref are required for this optional check.', 'Provide a scoped token with auth_config_read permission to verify Site URL and Redirect URLs.'))
    return { results, config: null }
  }

  let response
  try {
    response = await fetchJson(`https://api.supabase.com/v1/projects/${encodeURIComponent(context.projectRef)}/config/auth`, {
      headers: { authorization: `Bearer ${context.managementToken}` },
      timeoutMs: 8000,
    }, fetchImpl)
  } catch (error) {
    results.push(result('management.auth-config', STATUS.WARN, 'Management API request failed', String(error?.message ?? error), 'Verify token permissions and network access.'))
    return { results, config: null }
  }

  if (!response.ok) {
    const hint = response.status === 401 || response.status === 403
      ? 'Use a Supabase Management API token with auth_config_read permission for this project.'
      : 'Check the project ref and Management API availability.'
    results.push(result('management.auth-config', STATUS.WARN, 'Management API did not return Auth config', `HTTP ${response.status}.`, hint))
    return { results, config: response.data }
  }

  const config = response.data ?? {}
  results.push(result('management.auth-config', STATUS.PASS, 'Dashboard Auth config loaded', 'Site URL, provider flags, and redirect allow-list can be compared.', undefined))

  if (context.siteUrl && config.site_url) {
    let expected
    let actual
    try { expected = normalizeBaseUrl(context.siteUrl); actual = normalizeBaseUrl(config.site_url) } catch {}
    if (expected && actual && expected === actual) {
      results.push(result('management.site-url', STATUS.PASS, 'Environment and dashboard Site URL match', actual, undefined))
    } else {
      results.push(result('management.site-url', STATUS.FAIL, 'Environment and dashboard Site URL differ', `App: ${expected ?? context.siteUrl} | Dashboard: ${config.site_url}`, 'Align NEXT_PUBLIC_SITE_URL and Authentication → URL Configuration → Site URL.'))
    }
  } else if (config.site_url) {
    results.push(result('management.site-url', STATUS.WARN, 'Dashboard Site URL found but app Site URL is missing', config.site_url, 'Set NEXT_PUBLIC_SITE_URL to the canonical production URL.'))
  }

  const allowList = splitAllowList(config.uri_allow_list)
  if (allowList.length) {
    results.push(result('management.redirect-list', STATUS.PASS, 'Redirect allow-list loaded', `${allowList.length} redirect pattern(s) configured.`, undefined, { allowList }))

    for (const target of scan.redirectTargets.filter((x) => !x.dynamic)) {
      let normalized = target.value
      try { normalized = normalizeBaseUrl(target.value) } catch {}
      const ok = isAllowedRedirect(normalized, allowList) || isAllowedRedirect(target.value, allowList)
      results.push(result(`redirect.code.${target.file}.${target.value}`, ok ? STATUS.PASS : STATUS.FAIL, ok ? 'Code redirect is allow-listed' : 'Code redirect is not allow-listed', `${target.file}: ${target.value}`, ok ? undefined : 'Add this redirect URL (or a safe matching wildcard) under Authentication → URL Configuration.'))
    }

    if (context.vercelUrl) {
      let preview
      try { preview = normalizeBaseUrl(context.vercelUrl) } catch {}
      if (preview) {
        const ok = isAllowedRedirect(preview, allowList) || isAllowedRedirect(`${preview}/`, allowList)
        results.push(result('management.vercel-preview', ok ? STATUS.PASS : STATUS.WARN, ok ? 'Current Vercel URL is allow-listed' : 'Current Vercel URL is not matched by the redirect allow-list', preview, ok ? undefined : 'For previews, Supabase recommends a Vercel wildcard such as https://*-<team-or-account-slug>.vercel.app/**.'))
      }
    }
  } else {
    results.push(result('management.redirect-list', STATUS.WARN, 'Redirect allow-list is empty', 'No additional redirect URLs were returned.', 'Add local and preview callback destinations if your app uses redirectTo.'))
  }

  return { results, config }
}
