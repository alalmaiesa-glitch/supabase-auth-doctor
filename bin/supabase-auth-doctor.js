#!/usr/bin/env node
import { runDoctor, explainFlow } from '../src/index.js'
import { renderJson, renderText, summarize } from '../src/reporter.js'

function usage() {
  return `supabase-auth-doctor v0.1.0

Usage:
  supabase-auth-doctor [doctor] [options]
  supabase-auth-doctor explain [options]

Options:
  --cwd <path>         Project directory (default: current directory)
  --provider <name>    OAuth provider to verify (default: google)
  --json               Machine-readable output
  --offline            Skip network and Management API checks
  --no-color           Disable ANSI colors
  -h, --help           Show help

Optional environment variables:
  SUPABASE_PROJECT_REF  Enables Management API project lookup for custom domains
  SUPABASE_ACCESS_TOKEN Optional scoped token with auth_config_read to verify
                        dashboard Site URL and Redirect URL allow-list
`
}

function parseArgs(argv) {
  const args = [...argv]
  let command = 'doctor'
  if (args[0] && !args[0].startsWith('-')) command = args.shift()
  const options = { provider: 'google' }
  while (args.length) {
    const arg = args.shift()
    if (arg === '--cwd') options.cwd = args.shift()
    else if (arg === '--provider') options.provider = args.shift()
    else if (arg === '--json') options.json = true
    else if (arg === '--offline') options.offline = true
    else if (arg === '--no-color') options.color = false
    else if (arg === '-h' || arg === '--help') options.help = true
    else throw new Error(`Unknown option: ${arg}`)
  }
  return { command, options }
}

try {
  const { command, options } = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(usage())
    process.exit(0)
  }
  if (command === 'explain') {
    console.log(await explainFlow(options))
    process.exit(0)
  }
  if (command !== 'doctor') throw new Error(`Unknown command: ${command}`)
  const report = await runDoctor(options)
  console.log(options.json ? renderJson(report.results, report.context) : renderText(report.results, { color: options.color }))
  const summary = summarize(report.results)
  process.exitCode = summary.FAIL > 0 ? 1 : 0
} catch (error) {
  console.error(`supabase-auth-doctor: ${error?.message ?? error}`)
  process.exitCode = 2
}
