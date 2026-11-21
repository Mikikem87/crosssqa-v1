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

- `.github/workflows/ci.yml`
  Continuous integration type-checks TypeScript and verifies Playwright test discovery. It does not execute tests against an application.

- `tests/config/site.config.ts`  
  Global adapter object with site requirements and environment overrides.

- `tests/config/juice-shop.config.ts`
  Isolated configuration for the locally running OWASP Juice Shop spec.

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
  Security-focused checks: headers, configured auth rejection, and optional tenant boundaries.

- `tests/accessibility.spec.ts`  
  Accessibility checks using axe and keyboard navigation validation.

- `tests/api.spec.ts`  
  API contract and regression tests for auth, CRUD, pagination, and invalid-input handling.

- `tests/juice-shop.spec.ts`
  Read-only Juice Shop UI smoke and product-search API contract checks.

---

## Test Execution Model

The framework runs a browser matrix defined in `playwright.config.ts`:

- chromium
- firefox
- webkit
- mobile-chrome
- tablet-ipad

This provides broad cross-browser and device coverage without duplicating test logic. `fullyParallel: true` means tests may run concurrently across projects; the recommended workflow in `PROCESS.md` is a manual triage order, not an enforced sequential pipeline.

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
- optional `missingDetailPath`
- `createPath`
- `profilePath`
- `resourcePathTemplate`
- explicit mutation opt-in and expected create/update/delete statuses
- optional pagination/sorting contract
- optional tenant A/B tokens and owned resource paths

This lets the suite test different apps or APIs without changing the test logic itself.

---

## Helper Layer Details

### `gotoAndCollectErrors()`
Purpose:
- Resolve an absolute or relative route using the configured base URL and open it
- Capture JS console errors
- Capture page-level exceptions
- Capture failed HTTP responses (4xx/5xx)
- Remove its event listeners after navigation so results do not leak between checks

Why it matters:
- A page may render successfully but still be broken due to client-side script failures or failed API calls.
- This is one of the highest-value smoke checks.

### `runAxeScan()`
Purpose:
- Run axe accessibility analysis on the current page.

What it checks:
- missing labels
- bad landmarks
- ARIA and semantic issues
- contrast and structural accessibility issues

### `assertNoCriticalA11yIssues()`
Purpose:
- Fail if any critical accessibility violation is present.

### `assertFormLabels()`
Purpose:
- Ensure data-entry controls have an accessible name.

What it validates:
- `label[for="..."]` associations
- `aria-label`
- `aria-labelledby`
- `title` as a last-resort name
- Does not count the `name` attribute or placeholder by itself as a label

### `assertKeyboardNavigation()`
Purpose:
- Send real Tab key presses and verify focus advances through visible interactive elements.

Scope: this checks basic Tab-key movement. It does not prove complete focus order correctness or absence of every possible keyboard trap.

### `assertSecurityHeaders()`
Purpose:
- Validate configured response headers without navigating or reloading the page. Common examples:
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy

### `assertNoBrokenRoutes()`
Purpose:
- Check multiple routes for page errors and failed HTTP responses.

### `assertRouteContent()`
Purpose:
- Validate configured text and expected heading on the current page; it does not navigate.

### `resolveRouteUrl()`
Purpose:
- Resolve route URLs against the site adapter's `baseURL`.
- Reject malformed base URLs and avoid treating `about:blank` as a navigation base.

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

### Test: critical form fields and keyboard navigation are usable
Purpose:
- Ensure the most critical form is usable without a mouse.

What it checks:
- login page configured fields are visible
- real Tab key presses move through visible interactive controls

---

## Security Tests (`tests/security.spec.ts`)

### Test: configured security headers are present
Purpose:
- Validate the headers configured for the target site's homepage response.

What it checks:
- each configured header is present
- the response is captured once; this check does not reload the page

Security relevance:
- Missing headers often indicate a production security gap even when UI appears normal.

### Test: anonymous protected-page access is rejected
Purpose:
- Confirm protected pages are not accessible without auth.

What it checks:
- an HTTP 401/403 response, or
- a redirect to the adapter's configured login page
- a generic `/error` URL or any arbitrary success status is not accepted as proof

### Test: optional tenant isolation
Purpose:
- Verify tenant boundaries only when two distinct test credentials and known tenant-owned resources are configured.

What it checks:
- each bearer identity can read its own resource (200)
- neither identity can read the other tenant's resource (403 or 404)

Without all four `TENANT_A_TOKEN`, `TENANT_A_RESOURCE_PATH`, `TENANT_B_TOKEN`, and `TENANT_B_RESOURCE_PATH` values, the test is skipped. A generic route status test does not claim tenant isolation or export-limit coverage.

### Test: explicit site-specific security route contracts
Optional routes must define an exact expected status list in the site adapter. This verifies only that configured response contract; it does not prove authorization unless the expected behavior and credentials make that assertion meaningful.

### Test: critical routes do not return broken responses

Purpose:
- Check all critical routes for error signals.

---

## Accessibility Tests (`tests/accessibility.spec.ts`)

The homepage and login axe scans run as separate tests, so a failure in one does not prevent the other scan.

- Form fields must have an associated label, `aria-label`, `aria-labelledby`, or title. A `name` attribute or placeholder alone does not count.
- Keyboard checks press the real Tab key and confirm visible interactive controls receive focus. This is a basic progression check, not a proof of all focus-order rules or every keyboard trap.
- Landmark and heading checks require a main landmark and a heading structure.
- Skip-link, live-region, and dialog checks validate behavior/semantics when those components exist; those cases are skipped when the page has no such component.
- Reduced-motion coverage verifies Playwright can emulate the user preference. It does not claim to verify every app animation responds correctly.
- The custom contrast heuristic was removed because it made unreliable assumptions about transparent and layered backgrounds. Axe remains the automated accessibility scanner; manual review is still required.

---

## API Tests (`tests/api.spec.ts`)

The API suite asserts expected behavior rather than accepting a broad set of potentially incorrect statuses.

- Health: only 200/204 is successful.
- List: requires status 200, JSON content type, and an actual array in the response (or configured items path).
- Detail: configured existing resource must return 200 and an identifier. A separate configured missing path must return 404.
- Authentication: an explicitly configured protected profile path must return 401/403 without credentials.
- Pagination: optional adapter config supplies query parameter names, page size, sort field/order, and optional item path. The test verifies the limit and actual sorted order; it skips if not configured.
- Mutation lifecycle: create uses a UUID email; update/read-back/delete use the created resource ID; cleanup is attempted if later assertions fail.
- Invalid create: expects 400/422 and attempts cleanup if the API unexpectedly accepts the payload and returns an ID.

Create/update/delete and invalid-create tests are skipped unless `ALLOW_API_MUTATIONS=true` and `API_MUTATION_TARGET` exactly matches the configured API base URL. Enable them only against a disposable test environment. Create defaults to 201, update to 200/204, and delete to 200/204; customize these statuses in the adapter if the API contract differs.

---

## Fixtures and Test Data

The fixture layer provides reusable valid and invalid payload builders. The mutating lifecycle generates a unique email address for each run to avoid collisions between workers and browser projects.

### `buildUser()`
Creates a valid user object with defaults that can be overridden.

### `buildInvalidUser()`
Creates a deliberately invalid object to test validation flows.

The valid create payload uses a unique address per run to avoid collisions between workers and browser projects.

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
- anonymous access to configured protected pages
- tenant isolation failures when the required two-tenant configuration is provided
- malformed or incomplete API payload handling
- configured pagination and sorting contract failures
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
