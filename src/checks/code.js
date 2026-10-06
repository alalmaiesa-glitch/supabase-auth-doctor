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
    results.push(result('code.provider', STATUS.WARN, `${provider} was not found as a literal provider`, `Detected: ${scan.oauthProviders.join(', ')}`, `Use --provider <name> if diagnosing another provider.`))
  }

  if (!scan.redirectTargets.length) {
    results.push(result('code.redirect-to', STATUS.WARN, 'No redirectTo target detected', 'OAuth may fall back to the dashboard Site URL.', 'For SSR/PKCE flows, explicitly set redirectTo to your callback route and allow-list it.'))
  } else {
    const staticCount = scan.redirectTargets.filter((x) => !x.dynamic).length
    const dynamicCount = scan.redirectTargets.length - staticCount
    results.push(result('code.redirect-to', STATUS.PASS, 'redirectTo usage detected', `${staticCount} static and ${dynamicCount} dynamic target(s) found.`, undefined, { targets: scan.redirectTargets }))
  }
  return results
}
