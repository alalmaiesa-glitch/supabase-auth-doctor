import fs from 'node:fs/promises'
import path from 'node:path'

export const ENV_FILES = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.development.local',
  '.env.production',
  '.env.production.local',
  '.env.example',
]

export function parseEnvText(text) {
  const out = {}
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const normalized = line.startsWith('export ') ? line.slice(7).trim() : line
    const eq = normalized.indexOf('=')
    if (eq < 1) continue
    const key = normalized.slice(0, eq).trim()
    let value = normalized.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    } else {
      value = value.replace(/\s+#.*$/, '').trim()
    }
    out[key] = value
  }
  return out
}

export async function loadEnvFiles(cwd) {
  const byFile = {}
  for (const file of ENV_FILES) {
    const full = path.join(cwd, file)
    try {
      const text = await fs.readFile(full, 'utf8')
      byFile[file] = parseEnvText(text)
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }
  return byFile
}

export function mergeEnv(byFile, processEnv = process.env) {
  // Keep shell/CI env highest priority. Local files override generic files.
  const order = ['.env.example', '.env', '.env.development', '.env.production', '.env.local', '.env.development.local', '.env.production.local']
  const merged = {}
  for (const file of order) Object.assign(merged, byFile[file] ?? {})
  return { ...merged, ...processEnv }
}

export function firstEnv(env, names) {
  for (const name of names) {
    if (typeof env[name] === 'string' && env[name].trim()) return { name, value: env[name].trim() }
  }
  return null
}

export const SUPABASE_URL_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_URL',
]

export const SUPABASE_KEY_VARS = [
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
]

export const SITE_URL_VARS = ['NEXT_PUBLIC_SITE_URL', 'SITE_URL', 'PUBLIC_SITE_URL', 'VITE_SITE_URL']
export const VERCEL_URL_VARS = ['NEXT_PUBLIC_VERCEL_URL', 'VERCEL_URL']
export const PROJECT_REF_VARS = ['SUPABASE_PROJECT_REF', 'NEXT_PUBLIC_SUPABASE_PROJECT_REF']
export const MANAGEMENT_TOKEN_VARS = ['SUPABASE_ACCESS_TOKEN']
