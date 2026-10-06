# Contributing

Thanks for helping improve `supabase-auth-doctor`.

## Development

Requires Node.js 20 or newer.

```bash
npm run check
```

The check command validates syntax and runs the complete test suite.

Before opening a pull request:

1. Add or update tests for behavior changes.
2. Run `npm run check`.
3. Run `npm pack --dry-run` and verify no environment files or credentials are included.
4. Keep diagnostics read-only unless a future feature explicitly documents a safe write operation.

## Design rules

- Diagnose before automating fixes.
- Never print or persist secrets.
- Prefer deterministic checks over AI-generated advice.
- A warning must explain what is uncertain.
- A failure must include an actionable remediation.
- Keep the CLI dependency-light and fast.
