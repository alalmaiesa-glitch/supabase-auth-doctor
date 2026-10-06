import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { runDoctor } from '../src/index.js'
import { inspectEnvironment } from '../src/checks/env-checks.js'

async function makeProject(source) {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'supabase-auth-doctor-'))
  await fs.mkdir(path.join(cwd, 'app', 'auth', 'callback'), { recursive: true })
  await fs.writeFile(path.join(cwd, 'app', 'login.js'), source.login ?? '', 'utf8')
  await fs.writeFile(path.join(cwd, 'app', 'auth', 'callback', 'route.js'), source.callback ?? '', 'utf8')
  return cwd
}

test('fails SSR OAuth when exchangeCodeForSession is missing', async (t) => {
  const cwd = await makeProject({
    login: `import { createBrowserClient } from '@supabase/ssr'
const client = createBrowserClient('https://x.supabase.co', 'sb_publishable_x')
client.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: 'https://app.example.com/auth/callback' }
})`,
    callback: `import { createServerClient } from '@supabase/ssr'`,
  })
  t.after(() => fs.rm(cwd, { recursive: true, force: true }))

  const report = await runDoctor({
    cwd,
    offline: true,
    processEnv: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijkl.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      NEXT_PUBLIC_SITE_URL: 'https://app.example.com',
    },
  })

  const check = report.results.find((x) => x.id === 'code.pkce-exchange')
  assert.equal(check.status, 'FAIL')
})

test('passes SSR OAuth when callback exchanges the PKCE code', async (t) => {
  const cwd = await makeProject({
    login: `import { createBrowserClient } from '@supabase/ssr'
client.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: 'https://app.example.com/auth/callback' }
})`,
    callback: `import { createServerClient } from '@supabase/ssr'
export async function GET(request) {
  const code = new URL(request.url).searchParams.get('code')
  return client.auth.exchangeCodeForSession(code)
}`,
  })
  t.after(() => fs.rm(cwd, { recursive: true, force: true }))

  const report = await runDoctor({
    cwd,
    offline: true,
    processEnv: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijkl.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      NEXT_PUBLIC_SITE_URL: 'https://app.example.com',
    },
  })

  const check = report.results.find((x) => x.id === 'code.pkce-exchange')
  assert.equal(check.status, 'PASS')
})

test('fails localhost Site URL when production or Vercel is detected', () => {
  const { results } = inspectEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijkl.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    VERCEL_URL: 'example-git-main-team.vercel.app',
    NODE_ENV: 'production',
  })
  const site = results.find((x) => x.id === 'env.site-url')
  assert.equal(site.status, 'FAIL')
})
