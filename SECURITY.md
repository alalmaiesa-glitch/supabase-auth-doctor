# Security Policy

## Supported versions

Until the first stable release, security fixes are provided for the latest published version only.

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability.

Use GitHub's private vulnerability reporting for this repository when available. Include:

- the affected command or check;
- a minimal reproduction;
- the security impact;
- whether credentials or secrets may be exposed;
- any proposed mitigation.

## Secret-handling principles

`supabase-auth-doctor` is designed to diagnose configuration without printing secret values.

The CLI must never intentionally print:

- Supabase secret keys;
- legacy `service_role` keys;
- `SUPABASE_ACCESS_TOKEN`;
- OAuth client secrets.

Reports may include variable names, URLs, provider names, HTTP status codes, and non-secret project metadata.

If you discover a path that exposes credential values in terminal or JSON output, treat it as a security vulnerability.
