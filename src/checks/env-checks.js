import { STATUS, result } from '../result.js'
import {
  firstEnv,
  SUPABASE_URL_VARS,
  SUPABASE_KEY_VARS,
  SITE_URL_VARS,
  VERCEL_URL_VARS,
  PROJECT_REF_VARS,
  MANAGEMENT_TOKEN_VARS,
} from '../env.js'
import { deriveProjectRef, isLocalhostUrl, looksLikeSecretKey, normalizeBaseUrl } from '../project.js'

export function inspectEnvironment(env, byFile = {}) {
  const results = []
  const urlEntry = firstEnv(env, SUPABASE_URL_VARS)
  const keyEntry = firstEnv(env, SUPABASE_KEY_VARS)
  const siteEntry = firstEnv(env, SITE_URL_VARS)
  const vercelEntry = firstEnv(env, VERCEL_URL_VARS)
  const refEntry = firstEnv(env, PROJECT_REF_VARS)
  const tokenEntry = firstEnv(env, MANAGEMENT_TOKEN_VARS)

  let baseUrl = null
  if (!urlEntry) {
    results.push(result('env.supabase-url', STATUS.FAIL, 'Supabase URL not found', `Expected one of: ${SUPABASE_URL_VARS.join(', ')}`, 'Add the project URL to your environment.'))
  } else {
    try {
      baseUrl = normalizeBaseUrl(urlEntry.value)
      const protocol = new URL(baseUrl).protocol
      results.push(result('env.supabase-url', protocol === 'https:' || isLocalhostUrl(baseUrl) ? STATUS.PASS : STATUS.WARN, 'Supabase URL found', `${urlEntry.name} points to ${new URL(baseUrl).host}`, protocol === 'https:' || isLocalhostUrl(baseUrl) ? undefined : 'Use HTTPS for a hosted Supabase project.'))
    } catch {
      results.push(result('env.supabase-url', STATUS.FAIL, 'Supabase URL is invalid', `${urlEntry.name} is not a valid URL.`, 'Use a URL such as https://<project-ref>.supabase.co.'))
    }
  }

  if (!keyEntry) {
    results.push(result('env.public-key', STATUS.FAIL, 'Supabase publishable/anon key not found', `Expected one of: ${SUPABASE_KEY_VARS.join(', ')}`, 'Add a publishable key (preferred) or legacy anon key.'))
  } else if (looksLikeSecretKey(keyEntry.value)) {
    results.push(result('env.public-key', STATUS.FAIL, 'Secret/service-role key exposed as a public key', `${keyEntry.name} appears to be a privileged secret.`, 'Replace it with a publishable key. Never expose a secret/service_role key to browser code.'))
  } else {
    results.push(result('env.public-key', STATUS.PASS, 'Public Auth key found', `${keyEntry.name} is present.`, undefined))
  }

  if (!siteEntry) {
    results.push(result('env.site-url', STATUS.WARN, 'Production site URL not found', 'NEXT_PUBLIC_SITE_URL (or an equivalent) is not set.', 'Set NEXT_PUBLIC_SITE_URL to the canonical production URL, especially on Vercel.'))
  } else {
    try {
      const site = normalizeBaseUrl(siteEntry.value)
      const secure = new URL(site).protocol === 'https:' || isLocalhostUrl(site)
      const productionLike = env.NODE_ENV === 'production' || Boolean(vercelEntry)
      const localhostInProduction = productionLike && isLocalhostUrl(site)
      const status = localhostInProduction ? STATUS.FAIL : (secure ? STATUS.PASS : STATUS.FAIL)
      const fix = localhostInProduction
        ? 'Set the canonical production URL. Supabase can fall back to Site URL when redirectTo is missing or rejected.'
        : (secure ? undefined : 'Use HTTPS for production site URLs.')
      const detail = localhostInProduction
        ? `${siteEntry.name} = ${site}; production/Vercel environment detected.`
        : `${siteEntry.name} = ${site}`
      results.push(result('env.site-url', status, localhostInProduction ? 'Production Site URL still points to localhost' : 'Site URL found', detail, fix))
    } catch {
      results.push(result('env.site-url', STATUS.FAIL, 'Site URL is invalid', `${siteEntry.name} is not a valid URL.`, 'Set a complete URL such as https://example.com.'))
    }
  }

  if (vercelEntry) {
    results.push(result('env.vercel-url', STATUS.PASS, 'Vercel deployment URL detected', `${vercelEntry.name} is present.`, undefined))
  } else {
    results.push(result('env.vercel-url', STATUS.UNKNOWN, 'Vercel deployment URL not detected', 'This may be normal outside Vercel.', undefined))
  }

  const ref = refEntry?.value ?? (baseUrl ? deriveProjectRef(baseUrl) : null)
  if (ref) {
    results.push(result('env.project-ref', STATUS.PASS, 'Supabase project ref available', refEntry ? `Using ${refEntry.name}.` : 'Derived project ref from the supabase.co hostname.', undefined))
  } else {
    results.push(result('env.project-ref', STATUS.WARN, 'Project ref unavailable', 'A custom Supabase domain may prevent automatic project-ref discovery.', 'Set SUPABASE_PROJECT_REF to enable Management API checks.'))
  }

  if (tokenEntry) {
    results.push(result('env.management-token', STATUS.PASS, 'Management API token detected', `${tokenEntry.name} is present; dashboard configuration can be checked.`, undefined))
  } else {
    results.push(result('env.management-token', STATUS.UNKNOWN, 'Management API token not provided', 'Public checks will still run, but Site URL and Redirect URL allow-list cannot be verified against the dashboard.', 'Optional: set SUPABASE_ACCESS_TOKEN with auth_config_read permission.'))
  }

  const local = byFile['.env.local'] ?? {}
  const example = byFile['.env.example'] ?? {}
  const relevant = Object.keys(local).filter((k) => /SUPABASE|SITE_URL|VERCEL_URL/.test(k))
  const absent = relevant.filter((k) => !(k in example) && k !== 'SUPABASE_ACCESS_TOKEN')
  if (relevant.length && absent.length) {
    results.push(result('env.example-sync', STATUS.WARN, '.env.example is missing configuration keys', `Missing key names: ${absent.join(', ')}`, 'Add placeholders for these variable names to .env.example (never real secrets).'))
  } else if (relevant.length) {
    results.push(result('env.example-sync', STATUS.PASS, '.env.example covers local Auth variables', 'Relevant variable names are represented.', undefined))
  }

  return { results, context: { baseUrl, key: keyEntry?.value ?? null, siteUrl: siteEntry?.value ?? null, vercelUrl: vercelEntry?.value ?? null, projectRef: ref, managementToken: tokenEntry?.value ?? null } }
}
