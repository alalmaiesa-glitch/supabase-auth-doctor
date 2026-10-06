import { STATUS, result } from '../result.js'

export function inspectCode(scan, provider = 'google') {
  const results = []
  if (!scan.usesOAuth) {
    results.push(result('code.oauth', STATUS.UNKNOWN, 'No signInWithOAuth call detected', `${scan.scannedFiles} source file(s) scanned.`, 'If OAuth is configured elsewhere or generated dynamically, this is expected.'))
    return results
  }

  results.push(result('code.oauth', STATUS.PASS, 'OAuth usage detected in source', `${scan.scannedFiles} source file(s) scanned.`, undefined))

  if (scan.oauthProviders.includes(provider)) {
    results.push(result('code.provider', STATUS.PASS, `${provider} appears in OAuth source`, `Detected provider: '${provider}'.`, undefined))
  } else if (scan.oauthProviders.length) {
    results.push(result('code.provider', STATUS.WARN, `${provider} was not found as a literal provider`, `Detected: ${scan.oauthProviders.join(', ')}`, 'Use --provider <name> if diagnosing another provider.'))
  }

  if (!scan.redirectTargets.length) {
    results.push(result('code.redirect-to', STATUS.WARN, 'No redirectTo target detected', 'OAuth may fall back to the dashboard Site URL.', 'For SSR/PKCE flows, explicitly set redirectTo to your callback route and allow-list it.'))
  } else {
    const staticCount = scan.redirectTargets.filter((x) => !x.dynamic).length
    const dynamicCount = scan.redirectTargets.length - staticCount
    results.push(result('code.redirect-to', STATUS.PASS, 'redirectTo usage detected', `${staticCount} static and ${dynamicCount} dynamic target(s) found.`, undefined, { targets: scan.redirectTargets }))
  }

  if (scan.usesSsr) {
    if (scan.usesExchangeCode) {
      const detail = scan.codeExchangeFiles.length
        ? `exchangeCodeForSession detected in: ${scan.codeExchangeFiles.join(', ')}`
        : 'exchangeCodeForSession detected in source.'
      results.push(result('code.pkce-exchange', STATUS.PASS, 'SSR/PKCE code exchange detected', detail, undefined, { callbackRouteFiles: scan.callbackRouteFiles }))
    } else {
      const routeHint = scan.callbackRouteFiles.length
        ? `Callback-like route(s) found: ${scan.callbackRouteFiles.join(', ')}, but no code exchange was detected.`
        : 'No exchangeCodeForSession call was found in the scanned source.'
      results.push(result(
        'code.pkce-exchange',
        STATUS.FAIL,
        'Supabase SSR OAuth is missing the PKCE code exchange',
        routeHint,
        'In the OAuth callback route, read the code query parameter and call exchangeCodeForSession(code) with the server-side Supabase client.'
      ))
    }
  }

  return results
}
