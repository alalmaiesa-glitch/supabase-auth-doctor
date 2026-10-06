import fs from 'node:fs/promises'
import path from 'node:path'

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte', '.astro'])
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.vercel'])

async function walk(dir, root, out, limit) {
  if (out.length >= limit) return
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (out.length >= limit) return
    if (entry.name.startsWith('.') && !entry.isFile()) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) await walk(full, root, out, limit)
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      out.push({ full, relative: path.relative(root, full) })
    }
  }
}

export async function scanAuthCode(cwd, limit = 800) {
  const files = []
  await walk(cwd, cwd, files, limit)
  const redirectTargets = []
  const oauthProviders = new Set()
  let usesOAuth = false

  for (const file of files) {
    let text
    try {
      text = await fs.readFile(file.full, 'utf8')
    } catch {
      continue
    }
    if (text.includes('signInWithOAuth')) usesOAuth = true

    for (const m of text.matchAll(/provider\s*:\s*['"]([a-zA-Z0-9_:-]+)['"]/g)) oauthProviders.add(m[1])

    for (const m of text.matchAll(/redirectTo\s*:\s*([`'"])(.*?)\1/gs)) {
      const literal = m[2].trim()
      if (literal && !literal.includes('${')) {
        redirectTargets.push({ file: file.relative, value: literal })
      } else if (literal) {
        redirectTargets.push({ file: file.relative, value: literal, dynamic: true })
      }
    }
  }

  return { usesOAuth, oauthProviders: [...oauthProviders], redirectTargets, scannedFiles: files.length }
}
