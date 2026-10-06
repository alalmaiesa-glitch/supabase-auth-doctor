# Contributing

Thanks for helping improve `supabase-auth-doctor`.

The most valuable contributions are real Supabase Auth failures that the doctor currently misses, misclassifies, or explains poorly.

## Before opening an issue

Please:

1. Run the latest published version.
2. Remove or redact all credentials from terminal output.
3. Include the smallest reproducible project shape or code snippet possible.
4. Say what you expected the doctor to report and what it actually reported.

**Never include Supabase secret keys, service-role keys, Management API tokens, OAuth client secrets, or session tokens in a public issue.**

Use the repository security policy for suspected credential exposure or security vulnerabilities.

## Local development

Requires Node.js 20 or newer.

```bash
git clone https://github.com/alalmaiesa-glitch/supabase-auth-doctor.git
cd supabase-auth-doctor
npm run check
```

There are currently no runtime dependencies to install.

To run the local CLI:

```bash
node ./bin/supabase-auth-doctor.js --help
```

To test it against another project:

```bash
node ./bin/supabase-auth-doctor.js --cwd /path/to/project
```

## Before opening a pull request

1. Add or update tests for behavior changes.
2. Run `npm run check`.
3. Run `npm pack --dry-run`.
4. Verify no environment files, credentials, fixtures with secrets, or unrelated artifacts are included.
5. Keep the change focused on one diagnostic problem when practical.

## Design rules

- Diagnose before automating fixes.
- Keep diagnostics read-only unless a future feature explicitly documents a safe write operation.
- Never print, persist, or transmit secret values unnecessarily.
- Prefer deterministic checks over AI-generated advice.
- A warning must explain what is uncertain.
- A failure must include an actionable remediation.
- Do not convert missing optional access into a false failure.
- Keep the CLI dependency-light and fast.
- Avoid framework-specific assumptions unless the check can clearly detect that framework.

## Pull request scope

Good pull requests usually do one of these:

- detect a concrete Auth misconfiguration;
- reduce a false positive or false negative;
- add a regression test from a real failure;
- improve a remediation message;
- add support for a common environment naming convention.

Large rewrites should start as a feature request first.
