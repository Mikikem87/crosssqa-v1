# Live Site Example: idavidov.eu

The public-site example is isolated in `tests/idavidov.spec.ts`; it does not replace the generic adapter in `tests/config/site.config.ts` or claim that the site has login, protected routes, or an API under test.

## Covered checks

- homepage and article route content
- console/page errors and failed HTTP responses
- homepage security headers
- homepage axe scan, executed in a separate test from header validation
- real Tab-key navigation

## Scope and limitations

- The example is an unauthenticated public-site smoke/accessibility/security-header check.
- It does not validate API behavior, login, tenant isolation, export limits, or pricing authorization.
- Missing headers observed in a historical run should be rechecked before being reported as a current finding.
- The Tab check demonstrates basic focus movement; it is not a complete accessibility audit.

Run it with:

```bash
npx playwright test tests/idavidov.spec.ts --project=chromium
```
