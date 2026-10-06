import test from 'node:test'
import assert from 'node:assert/strict'
import { runDoctor } from '../src/index.js'

function fakeFetch(url) {
  if (String(url).includes('/auth/v1/settings')) {
    return Promise.resolve(new Response(JSON.stringify({ external: { google: true } }), { status: 200, headers: { 'content-type': 'application/json' } }))
  }
  throw new Error(`Unexpected URL: ${url}`)
}

test('doctor confirms enabled provider using public settings', async () => {
  const report = await runDoctor({
    cwd: new URL('../fixtures/example-app', import.meta.url).pathname,
    fetchImpl: fakeFetch,
    processEnv: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijkl.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      NEXT_PUBLIC_SITE_URL: 'https://app.example.com',
    },
  })
  const provider = report.results.find((x) => x.id === 'auth.provider.google')
  assert.equal(provider.status, 'PASS')
})
