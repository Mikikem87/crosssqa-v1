# QA Checklist

## 1. Pre-run setup

- [ ] Confirm the target app URL is available and reachable.
- [ ] Confirm browser environment and viewport matrix is configured.
- [ ] Confirm `BASE_URL` and API base URL are correct.
- [ ] Confirm login selectors and protected routes match the real app.
- [ ] Confirm required route list matches the current app pages.
- [ ] Confirm expected titles and page text are aligned with the app.
- [ ] Confirm environment variables are set for auth and API endpoints.
- [ ] Confirm the app server or environment is running before executing UI/API tests.

## 2. Smoke/regression checks

- [ ] Home page loads without console errors.
- [ ] Login page loads without console errors.
- [ ] Protected page route loads or redirects correctly.
- [ ] No page-level JS exceptions are thrown.
- [ ] No failed HTTP responses occur on critical routes.
- [ ] Required headings are visible.
- [ ] Required page text is visible.
- [ ] Core UI controls are visible and usable.
- [ ] Page title matches expected value.

## 3. Accessibility checks

- [ ] Run axe scan on key pages.
- [ ] No critical accessibility issues remain.
- [ ] Form controls have accessible labels.
- [ ] Keyboard navigation reaches focusable controls.
- [ ] Page has a main landmark.
- [ ] Page includes a clear heading structure.
- [ ] Login form remains keyboard usable.

## 4. Security checks

- [ ] Required security headers exist on public pages.
- [ ] CSP, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy are present.
- [ ] Unauthenticated users cannot access protected pages.
- [ ] Unauthenticated users cannot access sensitive API routes.
- [ ] Route traversal attempts fail safely.
- [ ] Tenant/export/pricing-related routes are not trivially accessible.
- [ ] Broken routes do not leak application errors.

## 5. API checks

- [ ] Health endpoint returns success status.
- [ ] List endpoint returns JSON.
- [ ] Detail endpoint returns resource or 404 for invalid ID.
- [ ] Create endpoint accepts valid payloads.
- [ ] Create endpoint rejects invalid payloads cleanly.
- [ ] Update endpoint handles partial/full payloads correctly.
- [ ] Delete endpoint handles missing/invalid IDs gracefully.
- [ ] Pagination and sorting parameters work or fail safely.
- [ ] Response schema includes required fields.
- [ ] Auth routes reject unauthenticated requests.

## 6. Browser and viewport coverage

- [ ] Chromium desktop checks pass.
- [ ] Firefox desktop checks pass.
- [ ] WebKit checks pass.
- [ ] Mobile layout checks pass.
- [ ] Tablet layout checks pass.
- [ ] Responsive layout still exposes required controls and headings.

## 7. Regression gate

- [ ] No open console or page errors in critical flows.
- [ ] No critical accessibility violations.
- [ ] No unauthorized access to protected routes.
- [ ] No broken route or failed API contract on critical paths.
- [ ] Results are recorded and linked to the relevant app build or release.

## 8. Sign-off

- [ ] QA has reviewed the results for all priority routes.
- [ ] Security team has reviewed any failure that impacts auth or tenant isolation.
- [ ] Product owner has confirmed the tested user flows match the expected behavior.
- [ ] Release can proceed or blockers are documented.
