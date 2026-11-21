# QA Process Flow

## 1. Define the target app

Before starting the test run, confirm:

- the application URL is known
- the API base URL is known
- the login page exists and is accessible
- the main protected routes are known
- the product owner or project team agrees on the critical flows

This should be captured in the site adapter config so the test suite remains generic.

The standard Playwright configuration uses `fullyParallel: true`. The phases below are a recommended manual triage order, not an automatic sequential pipeline: `npx playwright test` runs tests concurrently across the browser/device projects.

---

## 2. Configure the adapter

Update the app-specific values in `tests/config/site.config.ts`:

- `baseURL`
- `requiredRoutes`
- `loginPage`
- `protectedPage`
- `expectedTitleText`
- `auth`
- `securityHeaders`
- `api`

This is the single source of truth for app-specific behavior.

---

## 3. Validate the environment

Check that:

- the app is running
- the API is available
- the test environment matches the expected build
- all environment variables are populated
- selectors are valid for the current app version

If one of these fails, fix the environment before running the suite.

---

## 4. Run smoke tests first

Run the smoke suite before deeper checks.

Goal:
- confirm the most important flows still work
- detect console errors, broken routes, or failed critical pages
- validate user-facing basics without relying on deep product logic

Smoke suite includes:
- home page loads
- login page loads
- forms and inputs are present
- route content and headings are visible

Protected-page access behavior is checked separately in the security suite.

If smoke tests fail, stop and fix the app or config before continuing.

---

## 5. Run security tests

After smoke passes, run the security suite.

Focus areas:
- missing security headers
- unauthenticated access to protected pages and explicitly configured API routes
- tenant isolation only when separate tenant identities and owned resources are configured
- application-specific export/pricing authorization rules
- broken routes exposing internal errors

Generic route status checks do not prove tenant isolation, export limits, or authorization. Add app-specific test identities, data, and expected outcomes for those claims.

---

## 6. Run accessibility tests

Run the accessibility checks next.

Focus areas:
- axe violations
- form labels and accessible names
- real Tab-key movement
- page landmarks and headings
- axe-detected contrast and semantic issues
- optional component checks for skip links, live regions, and dialogs

The reduced-motion test only verifies that the browser preference can be emulated; verify application animation behavior separately where needed.

---

## 7. Run API tests

Run the API suite after UI checks.

Focus areas:
- health endpoint
- list endpoint contract
- detail endpoint behavior
- create and update validation
- delete behavior
- configured pagination size and sorted order
- auth rejection on configured protected API routes
- JSON shape validation
- opt-in CRUD against a disposable environment only

This stage answers: "Does the application contract behave as expected under valid and invalid inputs?"

---

## 8. Review results and triage failures

For every failing test, classify the failure:

- configuration issue
- app regression
- security issue
- accessibility issue
- API contract issue
- flaky test

Then decide whether the issue is:

- a blocker
- a known issue
- a low-priority improvement
- a test bug

Do not ignore failed security or auth checks.

---

## 9. Sign-off criteria

The test pass is valid only when:

- smoke checks are passing
- security checks are passing or documented as accepted risk
- critical accessibility issues are resolved
- API contract checks are passing
- all browser/device matrix checks are reviewed
- release notes or known issues are documented if needed

---

## 10. Release recommendation

Use the following rule:

- Green: release can proceed
- Yellow: release can proceed only with documented exceptions
- Red: blocker; do not release

Typical blockers:

- auth bypass
- missing security headers
- critical accessibility breakage
- broken critical user flows
- API contract regressions on critical endpoints

---

## 11. Example execution order

The following commands are useful for manually triaging failures in phases. They do not change Playwright's parallel behavior when the full suite is run.

```bash
# 1. config and environment
# 2. smoke
npx playwright test tests/smoke.spec.ts

# 3. security
npx playwright test tests/security.spec.ts

# 4. accessibility
npx playwright test tests/accessibility.spec.ts

# 5. API
npx playwright test tests/api.spec.ts

# 6. full suite
npx playwright test
```

---

## 12. Summary

This process keeps QA focused on the highest-value checks first:

1. app still loads
2. app is secure
3. app is accessible
4. app contract is stable
5. release decision is evidence-based

This gives a repeatable and predictable QA workflow for multiple web products.
