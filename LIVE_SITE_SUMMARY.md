# Live Site Validation Summary

The framework includes an explicitly scoped Playwright example for `https://idavidov.eu`.

The latest v1.1 run reported 3 passed and 2 failed:

- Missing expected security headers on the homepage
- Critical axe violation: the “Load more posts” button references an invalid `aria-controls` target

The header and axe checks are separate, so both results are reported independently.

Run the current example with:

```bash
npx playwright test tests/idavidov.spec.ts --project=chromium
```

These results describe a single run and should be rechecked before being treated as current. The example does not cover authenticated flows, API contracts, tenant isolation, export limits, or pricing authorization.
