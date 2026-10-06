import test from 'node:test'
import assert from 'node:assert/strict'
import { isAllowedRedirect, supabaseGlobToRegExp } from '../src/glob.js'

test('Supabase wildcard semantics distinguish * and ** for separators', () => {
  assert.equal(supabaseGlobToRegExp('http://localhost:3000/*').test('http://localhost:3000/foo'), true)
  assert.equal(supabaseGlobToRegExp('http://localhost:3000/*').test('http://localhost:3000/foo/bar'), false)
  assert.equal(supabaseGlobToRegExp('http://localhost:3000/**').test('http://localhost:3000/foo/bar'), true)
})

test('allow list matches exact URLs', () => {
  assert.equal(isAllowedRedirect('https://app.example.com/auth/callback', ['https://app.example.com/auth/callback']), true)
})
