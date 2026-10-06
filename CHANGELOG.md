# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

### Added
- Repository-aware PKCE validation for Supabase SSR OAuth: detects missing `exchangeCodeForSession(code)` in the scanned project.
- Detection of production/Vercel deployments whose configured Site URL still points to localhost.

## [0.1.0] - 2026-10-06

### Added
- CLI diagnostics for Supabase Auth configuration.
- Public Auth settings check through `/auth/v1/settings`.
- OAuth provider enablement checks.
- Supabase project URL and publishable/anon key validation.
- Protection against accidentally exposing `sb_secret_` or legacy `service_role` keys as public keys.
- Production Site URL and Vercel URL checks.
- Source scanning for `signInWithOAuth`, provider names, and `redirectTo`.
- Comparison of `.env.local` and `.env.example` variable names.
- Optional Supabase Management API checks for Site URL and redirect allow-list.
- `explain` command for visualizing the OAuth redirect flow.
- Text and JSON reports with PASS, WARN, FAIL, and UNKNOWN states.
- CI across Node.js 20, 22, and 24.
- npm Trusted Publishing workflow using GitHub Actions OIDC.
