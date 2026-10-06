import test from 'node:test'
import assert from 'node:assert/strict'
import { parseEnvText } from '../src/env.js'
import { deriveProjectRef, callbackUrl, looksLikeSecretKey } from '../src/project.js'


test('parseEnvText parses quoted and exported values', () => {
  const env = parseEnvText(`\n# x\nexport A="hello"\nB='world'\nC=value # note\n`)
  assert.deepEqual(env, { A: 'hello', B: 'world', C: 'value' })
})

test('derive project ref and callback from hosted URL', () => {
  assert.equal(deriveProjectRef('https://abcdefghijkl.supabase.co'), 'abcdefghijkl')
  assert.equal(callbackUrl('https://abcdefghijkl.supabase.co/'), 'https://abcdefghijkl.supabase.co/auth/v1/callback')
})

test('detects modern secret keys and legacy service role JWTs', () => {
  assert.equal(looksLikeSecretKey('sb_secret_abc'), true)
  const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')
  assert.equal(looksLikeSecretKey(`a.${payload}.b`), true)
  assert.equal(looksLikeSecretKey('sb_publishable_abc'), false)
})
