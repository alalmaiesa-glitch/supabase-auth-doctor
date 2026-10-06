# FAQ

## Does the doctor change my Supabase project?

No. The current CLI is read-only. It diagnoses configuration and explains likely fixes.

## Does it print my keys or tokens?

It is designed not to print secret values. Reports may include environment variable names, hosts, URLs, provider names, HTTP status codes, and other non-secret metadata.

If you discover credential output, treat it as a security issue and follow [SECURITY.md](../SECURITY.md).

## Why do I see UNKNOWN?

`UNKNOWN` means the doctor did not have enough information to make a reliable pass/fail decision.

The most common example is dashboard configuration. Without a scoped `SUPABASE_ACCESS_TOKEN`, the CLI cannot verify Site URL and Redirect URL allow-lists through the Management API.

That is not automatically a failure.

## Do I need a Supabase Management API token?

No.

The default command can still:

- inspect environment configuration;
- scan OAuth-related source code;
- call the public Auth settings endpoint;
- verify provider availability.

A Management API token is only for deeper dashboard comparison.

## Which permission should the Management API token have?

Use the narrowest scope needed for the check. The current deep Auth configuration check expects `auth_config_read`.

Do not place the token in a browser-exposed environment variable or commit it to the repository.

## What is the difference between the provider callback and redirectTo?

The **provider callback** points from the OAuth provider back to Supabase Auth:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

The application **redirectTo** target is where Supabase sends the user after the provider exchange. That URL must be allowed by the Supabase redirect configuration.

Run:

```bash
npx supabase-auth-doctor explain
```

to visualize the route.

## Why does SSR/PKCE need exchangeCodeForSession?

In a Supabase SSR OAuth flow, the callback receives an authorization code. The server-side callback route must exchange that code for a session.

If the project uses `@supabase/ssr` but no `exchangeCodeForSession` call is found, the doctor reports a failure.

## What if I use a custom Supabase domain?

The project ref may not be derivable from the hostname.

Set:

```bash
SUPABASE_PROJECT_REF=your-project-ref
```

when you want Management API checks.

## Does it support Vercel preview deployments?

It detects common Vercel URL environment variables and, when dashboard configuration is available, compares the current Vercel URL with the redirect allow-list.

Preview wildcard policy still belongs to your Supabase project configuration; the doctor does not add it for you.

## Can I run it in CI?

Yes.

Use JSON output when another process will consume the result:

```bash
npx supabase-auth-doctor --json
```

Exit code `1` means at least one diagnostic check failed.

## The doctor missed my real Auth failure. What should I do?

That is useful feedback.

Open a bug report with:

- the CLI version;
- Node version;
- framework/runtime;
- a redacted diagnostic report;
- a minimal code/configuration example;
- the actual root cause once known.

Do not include credentials.
