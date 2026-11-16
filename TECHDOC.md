# CrossSQA Technical Test Documentation

## Purpose

This project is a reusable Playwright + TypeScript QA framework designed for cross-site regression testing across different web applications. The goal is to keep a generic, low-maintenance test layer that can be reused across multiple products while allowing each site to provide its own config and selectors through an adapter pattern.

The suite is built around three principles:

1. Reusability – common checks should be implemented once and reused across apps.
2. Adaptability – app-specific routes, selectors, auth flows, and expectations live in config instead of hardcoded in tests.
3. Security and quality engineering – the suite covers smoke, security, accessibility, and API regressions in a consistent way.

---

## Architecture Overview

The project has four main layers:

1. Site adapter/config layer
   - Defines environment-driven values such as base URL, route names, auth selectors, protected routes, and API endpoints.
2. Generic helper layer
   - Provides reusable assertions for page load validation, accessibility checks, keyboard navigation, route validation, and API schema validation.
3. Page object layer
   - Encapsulates common page actions and element access for login and home-like flows.
4. Test suite layer
   - Executes smoke, security, accessibility, and API regressions using the shared config and helpers.

---

## Folder Structure

- `playwright.config.ts`  
  Browser matrix and base runtime configuration.

- `tests/config/site.config.ts`  
  Global adapter object with site requirements and environment overrides.

- `tests/helpers/qa.ts`  
  General-purpose UI assertions such as console error collection, route checks, keyboard validation, and accessibility helpers.

- `tests/helpers/auth.ts`  
  Reusable login/logout actions for authenticated flows.

- `tests/helpers/api.ts`  
  Reusable API response assertions and schema checks.

- `tests/pages/BasePage.ts`  
  Common navigation behavior used by page objects.

- `tests/pages/LoginPage.ts`  
  Login page object abstraction.

- `tests/pages/HomePage.ts`  
  Home page abstraction for generic landing-page checks.

- `tests/fixtures/testData.ts`  
  Reusable valid and invalid payload builders for API and UI tests.

- `tests/smoke.spec.ts`  
  Regression and smoke tests for critical paths.

- `tests/security.spec.ts`  
  Security-focused checks: headers, auth redirects, traversal attempts, route protection.

- `tests/accessibility.spec.ts`  
  Accessibility checks using axe and keyboard navigation validation.

- `tests/api.spec.ts`  
  API contract and regression tests for auth, CRUD, pagination, and invalid-input handling.

---

## Test Execution Model

The framework runs a browser matrix defined in `playwright.config.ts`:

- chromium
- firefox
- webkit
- mobile-chrome
- tablet-ipad

This provides a broad cross-browser and device coverage level without duplicating test logic. The same tests run across desktop and mobile/tablet viewports to catch responsive and browser-specific regressions.

---

## Site Adapter Pattern

To avoid hardcoding selectors and assumptions, the suite uses a `SiteAdapter` config object. Each site provides the values it needs:

- `baseURL`
- `requiredRoutes`
- `loginPage`
- `protectedPage`
- `expectedTitleText`
- `securityHeaders`
- `auth`
- `api`

This is the key abstraction that makes the suite reusable across different apps. The test logic reads the config at runtime instead of relying on a single app-specific implementation.

### Example adapter properties

`requiredRoutes` contains route metadata such as:

- `path`: the route to open
- `name`: user-readable name
- `expectedText`: text expected to appear on the page
- `expectedHeading`: page heading expected to exist

`loginPage` contains:

- `path`
- `emailSelector`
- `passwordSelector`
- `submitSelector`

`protectedPage` contains:

- `path`
- `expectedTitleText`

The same idea is used for API config:

- `baseURL`
- `healthPath`
- `listPath`
- `detailPath`
- `createPath`
- `updatePath`
- `deletePath`
- `authPath`
- `profilePath`

This lets the suite test different apps or APIs without changing the test logic itself.

---

## Helper Layer Details

### `gotoAndCollectErrors()`
Purpose:
- Open a route
- Capture JS console errors
- Capture page-level exceptions
- Capture failed HTTP responses (4xx/5xx)

Why it matters:
- A page may render successfully but still be broken due to client-side script failures or failed API calls.
- This is one of the highest-value smoke checks.

### `runAxeScan()`
Purpose:
- Run axe accessibility analysis on the current page.

What it checks:
- missing labels
- bad landmarks
- focus issues
- contrast and structural accessibility issues

### `assertNoCriticalA11yIssues()`
Purpose:
- Fail if any critical accessibility violation is present.

### `assertFormLabels()`
Purpose:
- Ensure each form control has a label or accessible name.

What it validates:
- `label[for="..."]` associations
- `aria-label`
- `aria-labelledby`
- `name` attribute as fallback

### `assertKeyboardNavigation()`
Purpose:
- Ensure interactive elements receive focus when tabbing.

Why it matters:
- Keyboard access is essential for accessibility and general usability.

### `assertSecurityHeaders()`
Purpose:
- Validate presence of important security headers such as:
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy

### `assertNoBrokenRoutes()`
Purpose:
- Check multiple routes for page errors and failed HTTP responses.

### `assertRouteContent()`
Purpose:
- Open a route and validate configured text and expected heading.

### `expectJsonResponse()`
Purpose:
- Validate JSON response status and content type.

### `expectSchemaShape()`
Purpose:
- Confirm required fields exist in a JSON response.

### `loginAsUser()` / `logout()`
Purpose:
- Reuse login/logout steps across authenticated flows without repeating code.

---

## Page Objects

### `BasePage`
Responsibilities:
- Holds the shared Page instance and configuration
- Builds absolute URLs from relative routes
- Opens pages consistently using the configured base URL

### `HomePage`
Responsibilities:
- Open the configured home route
- Validate static content and title text

### `LoginPage`
Responsibilities:
- Go to the configured login page
- Fill email and password fields
- Submit the login form
- Validate error messages when needed

These page objects are intentionally thin and reusable. They do not contain site-specific assumptions beyond the adapter values.

---

## Smoke Tests (`tests/smoke.spec.ts`)

### Test: route loads without console/page errors
Purpose:
- Validate the configured route loads successfully.
- Confirm no client-side JS errors occur.
- Confirm no 4xx/5xx responses occur.
- Confirm expected content appears.

What it checks:
- `console` events of type `error`
- `pageerror` events
- failed HTTP responses
- URL match for expected route
- expected heading/text from `requiredRoutes`

This is the core regression gate for the application.

### Test: core page basics work across the app
Purpose:
- Validate that pages still expose real UI semantics.

What it checks:
- there is at least one heading (`h1` or `h2`)
- there are no obvious structural issues in page layout
- login page has email and password inputs visible

### Test: protected routes require auth and routing is stable
Purpose:
- Ensure authenticated-only routes are not exposed unintentionally.

What it checks:
- not a generic error page
- response status is not a server error
- route does not expose broken or failing content

### Test: critical form fields and keyboard navigation are usable
Purpose:
- Ensure the most critical form is usable without a mouse.

What it checks:
- keyboard focus works on interactive controls
- important app headers are present
- security headers exist on the page

---

## Security Tests (`tests/security.spec.ts`)

### Test: security headers are present on public pages
Purpose:
- Validate that the app sends baseline security headers.

What it checks:
- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

Security relevance:
- Missing headers often indicate a production security gap even when UI appears normal.

### Test: unauthenticated access is blocked or redirected
Purpose:
- Confirm protected pages are not accessible without auth.

What it checks:
- redirects to login or auth pages
- 401/403 responses
- refusal of anonymous access to sensitive routes

### Test: tenant-scoped and export endpoints are not trivially accessible
Purpose:
- Validate common multi-tenant and sensitive data paths are not publicly accessible.

What it checks:
- routes like tenant/export/pricing-related pages are not directly open to unauthenticated users
- allowed responses are redirect/401/403, not direct success

### Test: routing checks do not reveal critical failures
Purpose:
- Check all critical routes for error signals.

### Test: route traversal payloads do not resolve to real pages
Purpose:
- Validate path traversal attempts fail without reaching app routes.

What it checks:
- attempts such as `../admin`, encoded traversal variants, and double-dot payloads

Security relevance:
- This is a common vulnerability class and should be part of a standard regression pack.

---

## Accessibility Tests (`tests/accessibility.spec.ts`)

### Test: homepage and auth page have no critical axe issues
Purpose:
- Run axe against the main public page and login page.

What it checks:
- missing labels
- broken landmark structure
- input accessibility issues
- focus and semantic problems

### Test: forms have labels and keyboard focus is visible
Purpose:
- Validate labeled controls and keyboard usability.

What it checks:
- field labels via HTML labels or aria attributes
- focus remains stable on keyboard interaction

### Test: headers and landmarks are present
Purpose:
- Ensure pages have semantic page structure.

What it checks:
- `main` or `[role="main"]`
- at least one heading (`h1` or `h2`)

---

## API Tests (`tests/api.spec.ts`)

### Test: health endpoint responds successfully
Purpose:
- Confirm service health is green.

What it checks:
- status code 200 or 204
- service is reachable

### Test: list endpoint returns a valid JSON payload
Purpose:
- Validate the collection endpoint contract.

What it checks:
- successful response
- content type is JSON
- body is returned and is parseable

### Test: detail endpoint returns a single resource or 404 for missing IDs
Purpose:
- Confirm detail endpoint behavior for valid and invalid IDs.

What it checks:
- 200 for valid resource
- 404 for missing resource
- required response fields exist when resource is returned

### Test: create endpoint accepts valid payloads and rejects invalid ones
Purpose:
- Validate create contract behavior.

What it checks:
- valid payload can create a record
- invalid payload is rejected with 400/422
- required fields are present in successful responses

### Test: update endpoint handles partial or full payloads safely
Purpose:
- Validate update contract behavior without allowing unsafe assumptions.

What it checks:
- valid update request succeeds or returns appropriate status
- invalid update request fails cleanly

### Test: delete endpoint handles invalid or missing IDs gracefully
Purpose:
- Validate deletion semantics and error handling.

What it checks:
- 200/204 for valid delete
- 404/403/401 for invalid or unauthorized delete attempts

### Test: unauthenticated access is rejected on protected API routes
Purpose:
- Ensure sensitive API endpoints are protected.

What it checks:
- unauthenticated requests are rejected

### Test: pagination and sorting parameters do not break the API contract
Purpose:
- Validate parameter handling for list endpoints.

What it checks:
- page, limit, sort, and order parameters do not break response parsing
- accepted or rejected with proper status handling

### Test: seed data fixtures cover standard user variants and role boundaries
Purpose:
- Ensure test data covers realistic values and role variants.

What it checks:
- fixtures are valid
- data includes at least one admin role
- email format is valid

---

## Fixtures and Test Data

The fixture layer provides reusable datasets for tests. It keeps tests deterministic and avoids inline hardcoded values that are difficult to maintain.

### `buildUser()`
Creates a valid user object with defaults that can be overridden.

### `buildInvalidUser()`
Creates a deliberately invalid object to test validation flows.

### `testUsers`
A small array of realistic user fixtures used for role and input validation tests.

This improves API contract tests by allowing a consistent set of valid and invalid payloads.

---

## Best Practices Used in This Suite

1. Keep tests generic and adapter-based
   - Site differences are isolated to config, not test logic.

2. Separate “must-pass” checks from app-specific checks
   - Universal checks run across all apps.
   - App-specific fields remain in config and adapters.

3. Cover both happy path and failure path
   - Not only “this works” but also “this fails safely”.

4. Validate response structure, not only HTTP status
   - This is essential for API quality.

5. Blend UI and API quality coverage
   - UI checks catch broken pages and accessibility issues.
   - API checks catch contract and auth regressions.

6. Test cross-browser and device layouts
   - Browser coverage catches responsive and browser-specific issues.

---

## Typical Risk Areas Covered

This suite is designed to catch the following categories of regressions:

- broken page loads
- JS console errors
- 4xx/5xx route failures
- missing labels and inaccessible forms
- keyboard-only navigation failures
- missing security headers
- unauthenticated access
- tenant isolation weaknesses
- path traversal and route exposure issues
- malformed or incomplete API payload handling
- pagination and sorting issues
- auth and CRUD contract drift

---

## How to Adapt for a New Site

To add a new site, create or update the adapter config in `tests/config/site.config.ts`.

Required values usually include:

- site base URL
- app route list
- login selectors
- protected routes
- expected text and headings
- security and API config

Once the adapter is correct, the same tests can run without rewriting the suite.

---

## Example Run Commands

```bash
npx playwright test
npx playwright test tests/smoke.spec.ts
npx playwright test tests/security.spec.ts
npx playwright test tests/accessibility.spec.ts
npx playwright test tests/api.spec.ts
```

---

## Summary

This framework is built to provide a stable QA baseline for many different web applications. It covers the most common production regressions across four critical areas:

- smoke and UI basics
- application security
- accessibility with keyboard support
- API contract and auth validation

By keeping the test logic generic and moving app details into config and adapters, the project remains maintainable and reusable while still being strong enough to catch meaningful regressions.
