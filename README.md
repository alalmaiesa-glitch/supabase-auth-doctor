# supabase-auth-doctor

A tiny CLI that diagnoses common **Supabase Auth + OAuth + Vercel** configuration mistakes before they cost you an afternoon.

```bash
npx supabase-auth-doctor
```

Example output:

```text
Supabase Auth Doctor

✓ PASS  Supabase URL found
✓ PASS  Public Auth key found
✗ FAIL  google provider is disabled
! WARN  Production site URL not found
? UNKNOWN  Dashboard Auth config not checked

1 failure(s), 1 warning(s), 1 unknown, 2 passed
```

## What V0.1 checks

- Supabase project URL and public key are present.
- A privileged `sb_secret_` / legacy `service_role` key was not put in a public-key variable.
- `/auth/v1/settings` is reachable with the configured key.
- The requested OAuth provider (Google by default) is enabled.
- The expected provider callback URL is computed correctly.
- Production Site URL is present and uses HTTPS.
- Vercel deployment URL is detected when available.
- `signInWithOAuth`, literal providers, and `redirectTo` targets are scanned from source.
- `.env.local` and `.env.example` key names are compared.
- Optional: with `SUPABASE_ACCESS_TOKEN`, the CLI reads the Supabase Auth configuration and verifies Site URL + redirect allow-list.

The CLI **never prints secret values**.

## Usage

```bash
# Diagnose current project
npx supabase-auth-doctor

# Diagnose another provider
npx supabase-auth-doctor --provider github

# Explain the OAuth route without running the full report
npx supabase-auth-doctor explain

# CI / scripts
npx supabase-auth-doctor --json

# Static checks only
npx supabase-auth-doctor --offline
```

### Optional deep dashboard check

Public Auth settings can confirm whether a provider is enabled, but Supabase's Site URL and additional Redirect URLs are project management configuration. To verify them too, provide a **scoped** Management API token with `auth_config_read`:

```bash
SUPABASE_PROJECT_REF=abcdefghijklmnopqrst \
SUPABASE_ACCESS_TOKEN='your-scoped-token' \
npx supabase-auth-doctor
```

Do not put `SUPABASE_ACCESS_TOKEN` in browser-exposed environment variables or commit it to the repository.

## `explain`

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

This separates two URLs developers often confuse:

1. **Provider callback URL** — registered in Google/GitHub/etc. It points back to Supabase Auth.
2. **App `redirectTo` URL** — allow-listed in Supabase and receives the user after Supabase completes the OAuth exchange.

## Exit codes

- `0`: no failing checks (warnings/unknowns may remain)
- `1`: one or more failing checks
- `2`: CLI usage/internal error

## Why this exists

A typical hosted OAuth flow spans application code, Supabase Auth provider settings, Supabase URL Configuration, the provider console, environment variables, and deployment URLs. A typo in any one layer can produce a generic redirect or provider error. `supabase-auth-doctor` turns that configuration chain into one diagnostic report.

## Scope

V0.1 deliberately stays small. It does not edit your Supabase project, change OAuth provider settings, or attempt sign-in on behalf of a user. It only diagnoses and explains.

## License

MIT
