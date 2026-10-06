import { STATUS, result } from '../result.js'
import { fetchJson } from '../http.js'
import { callbackUrl, settingsUrl } from '../project.js'

export async function inspectPublicAuth(context, provider = 'google', fetchImpl = fetch) {
  const results = []
  if (!context.baseUrl || !context.key) {
    results.push(result('auth.settings', STATUS.UNKNOWN, 'Auth settings check skipped', 'Supabase URL and public key are required.', 'Fix the environment failures first.'))
    return { results, settings: null }
  }

  let response
  try {
    response = await fetchJson(settingsUrl(context.baseUrl), {
      headers: { apikey: context.key, authorization: `Bearer ${context.key}` },
      timeoutMs: 7000,
    }, fetchImpl)
  } catch (error) {
    results.push(result('auth.settings', STATUS.FAIL, 'Supabase Auth endpoint is unreachable', error?.name === 'AbortError' ? 'Request timed out.' : String(error?.message ?? error), 'Verify the project URL, network, DNS, and project status.'))
    return { results, settings: null }
  }

  if (!response.ok) {
    results.push(result('auth.settings', STATUS.FAIL, 'Supabase Auth settings request failed', `GET /auth/v1/settings returned HTTP ${response.status}.`, response.status === 401 || response.status === 403 ? 'Verify the publishable/anon key belongs to this project.' : 'Verify the project URL and Auth service status.'))
    return { results, settings: response.data }
  }

  results.push(result('auth.settings', STATUS.PASS, 'Supabase Auth is reachable', 'GET /auth/v1/settings succeeded.', undefined))
  const enabled = response.data?.external?.[provider]
  if (enabled === true) {
    results.push(result(`auth.provider.${provider}`, STATUS.PASS, `${provider} provider is enabled`, `Auth settings report external.${provider} = true.`, undefined))
  } else if (enabled === false) {
    results.push(result(`auth.provider.${provider}`, STATUS.FAIL, `${provider} provider is disabled`, `Auth settings report external.${provider} = false.`, `Enable ${provider} under Authentication → Sign In / Providers.`))
  } else {
    results.push(result(`auth.provider.${provider}`, STATUS.UNKNOWN, `Could not confirm ${provider} provider`, `Auth settings did not expose external.${provider}.`, 'Check the provider configuration in the Supabase dashboard.'))
  }

  results.push(result('auth.oauth-callback', STATUS.PASS, 'Expected provider callback computed', callbackUrl(context.baseUrl), `Register this exact URL as the OAuth provider callback/redirect URI for hosted Auth.`))
  return { results, settings: response.data }
}
