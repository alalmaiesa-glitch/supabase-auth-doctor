import path from 'node:path'
import { loadEnvFiles, mergeEnv } from './env.js'
import { inspectEnvironment } from './checks/env-checks.js'
import { inspectPublicAuth } from './checks/public-auth.js'
import { inspectManagement } from './checks/management.js'
import { inspectCode } from './checks/code.js'
import { scanAuthCode } from './scanner.js'
import { callbackUrl, normalizeBaseUrl } from './project.js'

export async function runDoctor(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd())
  const provider = options.provider ?? 'google'
  const byFile = await loadEnvFiles(cwd)
  const env = mergeEnv(byFile, options.processEnv ?? process.env)
  const envInspection = inspectEnvironment(env, byFile)
  const scan = await scanAuthCode(cwd)
  const codeResults = inspectCode(scan, provider)
  const publicAuth = options.offline
    ? { results: [{ id: 'auth.settings', status: 'UNKNOWN', title: 'Network checks skipped', detail: '--offline was used.', fix: undefined }], settings: null }
    : await inspectPublicAuth(envInspection.context, provider, options.fetchImpl ?? fetch)
  const management = options.offline
    ? { results: [{ id: 'management.auth-config', status: 'UNKNOWN', title: 'Management API check skipped', detail: '--offline was used.', fix: undefined }], config: null }
    : await inspectManagement(envInspection.context, scan, options.fetchImpl ?? fetch)

  const results = [...envInspection.results, ...codeResults, ...publicAuth.results, ...management.results]
  return {
    results,
    context: {
      cwd,
      provider,
      callbackUrl: envInspection.context.baseUrl ? callbackUrl(envInspection.context.baseUrl) : null,
      scannedFiles: scan.scannedFiles,
      detectedProviders: scan.oauthProviders,
      redirectTargets: scan.redirectTargets,
    },
  }
}

export async function explainFlow(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd())
  const byFile = await loadEnvFiles(cwd)
  const env = mergeEnv(byFile, options.processEnv ?? process.env)
  const { context } = inspectEnvironment(env, byFile)
  const scan = await scanAuthCode(cwd)

  const base = context.baseUrl
  const callback = base ? callbackUrl(base) : '<unknown Supabase callback>'
  let appTarget = context.siteUrl ? normalizeBaseUrl(context.siteUrl) : '<dashboard Site URL>'
  const literal = scan.redirectTargets.find((x) => !x.dynamic)
  if (literal) appTarget = literal.value

  return [
    'Supabase OAuth Flow',
    '',
    'Browser / application',
    '  ↓ signInWithOAuth()',
    base ? `${base}/auth/v1/authorize` : '<Supabase Auth /authorize>',
    '  ↓',
    `${options.provider ?? 'google'} OAuth`,
    '  ↓ provider callback',
    callback,
    '  ↓ Supabase redirects after token exchange',
    appTarget,
    '',
    base ? `Expected provider callback: ${callback}` : 'Expected provider callback cannot be computed until the Supabase URL is configured.',
    literal ? `Detected redirectTo: ${literal.value} (${literal.file})` : 'No static redirectTo target detected; Supabase may use the configured Site URL.',
  ].join('\n')
}
