# QA Process Flow

## 1. Define the target app

Before starting the test run, confirm:

- the application URL is known
- the API base URL is known
- the login page exists and is accessible
- the main protected routes are known
- the product owner or project team agrees on the critical flows

This should be captured in the site adapter config so the test suite remains generic.

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
- protected routes behave consistently
- forms and inputs are present
- route content and headings are visible

If smoke tests fail, stop and fix the app or config before continuing.

---

## 5. Run security tests

After smoke passes, run the security suite.

Focus areas:
- missing security headers
- unauthenticated access to protected pages
- unauthorized API access
- tenant-isolation related endpoints
- route traversal or path manipulation vulnerabilities
- broken routes exposing internal errors

This stage answers: "Can an attacker reach or misuse the app in a straightforward way?"

---

## 6. Run accessibility tests

Run the accessibility checks next.

Focus areas:
- axe violations
- form labels and accessible names
- keyboard navigation
- page landmarks and headings
- contrast, semantics, and focus issues

This stage answers: "Is the app usable and understandable for keyboard and assistive technology users?"

---

## 7. Run API tests

Run the API suite after UI checks.

Focus areas:
- health endpoint
- list endpoint contract
- detail endpoint behavior
- create and update validation
- delete behavior
- pagination and sorting
- auth enforcement on protected API routes
- JSON shape validation

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
