# supabase-auth-doctor

[![npm version](https://img.shields.io/npm/v/supabase-auth-doctor.svg)](https://www.npmjs.com/package/supabase-auth-doctor)
[![npm downloads](https://img.shields.io/npm/dm/supabase-auth-doctor.svg)](https://www.npmjs.com/package/supabase-auth-doctor)
[![CI](https://github.com/alalmaiesa-glitch/supabase-auth-doctor/actions/workflows/ci.yml/badge.svg)](https://github.com/alalmaiesa-glitch/supabase-auth-doctor/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/node/v/supabase-auth-doctor.svg)](https://www.npmjs.com/package/supabase-auth-doctor)
[![License](https://img.shields.io/npm/l/supabase-auth-doctor.svg)](LICENSE)

**One command to find the Supabase Auth configuration mistake you have been debugging for an hour.**

`supabase-auth-doctor` is a read-only CLI that diagnoses common **Supabase Auth, OAuth, PKCE, redirect URL, environment, and Vercel configuration** mistakes directly from your project.

```bash
npx supabase-auth-doctor
```

No global install required. Node.js 20+.

## Why use it?

Supabase OAuth problems often span several places at once:

- application code;
- local environment variables;
- Supabase Auth provider settings;
- Supabase URL Configuration;
- OAuth provider callback URLs;
- Vercel production and preview URLs.

A single mismatch can look like a generic provider, redirect, or callback failure. The doctor turns those layers into one report with **PASS / WARN / FAIL / UNKNOWN** results and actionable fixes.

## 60-second quick start

From the root of a Supabase project:

```bash
npx supabase-auth-doctor
```

To diagnose a provider other than Google:

```bash
npx supabase-auth-doctor --provider github
```

For static checks only, with no network requests:

```bash
npx supabase-auth-doctor --offline
```

For machine-readable output:

```bash
npx supabase-auth-doctor --json
```

## Example output

```text
Supabase Auth Doctor

✓ PASS  Supabase URL found
✓ PASS  Public Auth key found
✓ PASS  Supabase Auth is reachable
✗ FAIL  google provider is disabled
! WARN  No redirectTo target detected
? UNKNOWN  Dashboard Auth config not checked

1 failure(s), 1 warning(s), 1 unknown, 3 passed
```

The important part is not the score. It is the fix attached to the failing check.

## What it checks

### Environment

- Finds common Supabase URL variables across Next.js, Vite, Expo and generic projects.
- Finds publishable or legacy anon keys.
- Fails if a privileged `sb_secret_` or legacy `service_role` key appears in a public-key variable.
- Checks production Site URL presence and HTTPS.
- Detects a localhost Site URL in a production/Vercel environment.
- Detects the current Vercel deployment URL when available.
- Compares relevant `.env.local` key names with `.env.example`.

### Supabase Auth

- Calls `/auth/v1/settings` using the configured public key.
- Confirms that Supabase Auth is reachable.
- Verifies whether the selected OAuth provider is enabled.
- Computes the expected hosted provider callback:
  `https://<project-ref>.supabase.co/auth/v1/callback`.

### Application code

- Detects `signInWithOAuth`.
- Detects literal OAuth provider names.
- Detects static and dynamic `redirectTo` targets.
- Detects `@supabase/ssr`.
- Fails an SSR/PKCE flow when no `exchangeCodeForSession(code)` call is found.
- Recognizes callback-like auth routes.

The source scanner covers JavaScript, TypeScript, JSX/TSX, Vue, Svelte and Astro files while skipping common build and dependency directories.

### Optional dashboard verification

With a scoped Supabase Management API token, the doctor can also compare the local project against dashboard Auth configuration:

- Site URL;
- Redirect URL allow-list;
- literal `redirectTo` targets;
- current Vercel URL.

This deeper check is optional.

## Safe by design

`supabase-auth-doctor` is diagnostic-only.

It does **not**:

- edit your Supabase project;
- enable or disable providers;
- change redirect URLs;
- attempt a user sign-in;
- print secret values.

The CLI may read local environment files to locate configuration, but reports variable names and non-secret metadata rather than credential values.

If you find a path that exposes a secret, please follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Optional deep dashboard check

Public Auth settings can confirm provider availability, but Site URL and Redirect URLs live in project management configuration.

Provide a **scoped** token with `auth_config_read` only when you want that comparison:

```bash
SUPABASE_PROJECT_REF=abcdefghijklmnopqrst \
SUPABASE_ACCESS_TOKEN='your-scoped-token' \
npx supabase-auth-doctor
```

Never commit `SUPABASE_ACCESS_TOKEN` or expose it to browser code.

## Understand the OAuth route

```bash
npx supabase-auth-doctor explain
```

Example:

```text
Supabase OAuth Flow

Browser / application
  ↓ signInWithOAuth()
https://example.supabase.co/auth/v1/authorize
  ↓
google OAuth
  ↓ provider callback
https://example.supabase.co/auth/v1/callback
  ↓ Supabase redirects after token exchange
https://myapp.com/auth/callback
```

Two URLs are commonly confused:

1. **Provider callback URL** — registered in Google, GitHub, or another OAuth provider. It points back to Supabase Auth.
2. **App `redirectTo` URL** — allow-listed in Supabase and receives the user after Supabase finishes the OAuth exchange.

## Commands and options

```text
supabase-auth-doctor [doctor] [options]
supabase-auth-doctor explain [options]

--cwd <path>         Project directory (default: current directory)
--provider <name>    OAuth provider to verify (default: google)
--json               Machine-readable output
--offline            Skip network and Management API checks
--no-color           Disable ANSI colors
-h, --help           Show help
```

## Exit codes

| Code | Meaning |
| ---: | --- |
| `0` | No failing checks. Warnings or unknowns may remain. |
| `1` | One or more checks failed. |
| `2` | CLI usage or internal error. |

## What an UNKNOWN means

`UNKNOWN` is intentionally different from `FAIL`.

For example, if you do not provide a Management API token, the doctor cannot verify dashboard-only redirect configuration. That is reported as `UNKNOWN`, not treated as a broken project.

See [FAQ](docs/FAQ.md) for common questions and troubleshooting.

## Current scope

The project deliberately starts small:

- diagnosis before automation;
- deterministic checks before generated advice;
- read-only behavior;
- zero runtime dependencies;
- actionable failure messages.

If a real Supabase Auth failure is not detected, that is the most useful kind of issue to report.

## Contributing

Bug reports, missed real-world failure cases, and focused checks are welcome.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Public bug reports must contain **redacted** output only.

## Release and package

- npm: [supabase-auth-doctor](https://www.npmjs.com/package/supabase-auth-doctor)
- latest GitHub release: [v0.1.0](https://github.com/alalmaiesa-glitch/supabase-auth-doctor/releases/tag/v0.1.0)
- changelog: [CHANGELOG.md](CHANGELOG.md)

Future npm releases use GitHub OIDC Trusted Publishing with **stage publish** permission. A release is staged for review before final approval rather than published directly by the workflow.

## License

MIT
