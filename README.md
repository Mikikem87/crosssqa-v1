# CrossSQA

Reusable Playwright + TypeScript framework for UI smoke/regression, security baselines, accessibility, and API contract testing across web applications.

## What it demonstrates

- Adapter-driven test design that keeps application routes and selectors out of generic assertions
- UI, API, security, and accessibility coverage with Playwright and axe-core
- Chromium, Firefox, WebKit, mobile, and tablet project configuration
- Explicitly scoped assertions that distinguish verified behavior from site-specific checks
- CI type checking, browser setup, helper tests, and Playwright test discovery

## Test coverage

| Suite | Coverage |
| --- | --- |
| Smoke | Configured route loading, page/console errors, failed responses, headings, and login form visibility |
| Security | Configured response headers, anonymous protected-page rejection/redirect, explicit route contracts, optional two-tenant resource isolation |
| Accessibility | Separate axe scans, accessible form names, recorded Tab/Shift+Tab focus movement, landmarks, and configured behavior checks for skip links, dialogs, live regions, and reduced-motion probes |
| API | Health, JSON collection shape, configured existing/missing detail resources, auth rejection, and configured pagination size/order/metadata |

Some checks need application-specific settings. Tenant isolation requires two separate bearer tokens and tenant-owned resource paths. CRUD mutation tests are separate, each uses its own generated resource, and all are skipped unless the disposable API target is explicitly confirmed. A generic status check alone is not treated as proof of tenant isolation, authorization, or export limits.

## Architecture

```text
Environment + site adapter
            |
            v
Reusable helpers + page objects
            |
            v
Smoke | Security | Accessibility | API tests
            |
            v
Application under test (Playwright browser/device projects)
```

Site-specific routes, selectors, API contracts, security scenarios, and expected content are configured in `tests/config/site.config.ts`. Shared assertions and URL resolution live in `tests/helpers/`.

## Getting started

Requirements: Node.js 22.12 or later and npm.

```bash
npm ci
npx playwright install
```

Set the target application and API in environment variables or update the adapter:

```text
BASE_URL=https://your-test-app.example
API_BASE_URL=https://your-test-app.example/api
```

Then update `tests/config/site.config.ts` with the app’s actual routes, login selectors, protected path, API resource paths, and expected page content. The default configuration is an example, not a universal app contract.

### Run tests

```bash
npm run typecheck
npx playwright test
```

Run an individual suite:

```bash
npm run test:smoke
npm run test:security
npm run test:a11y
npm run test:api
```

### Run the Juice Shop adapter

Start the locally installed Juice Shop container, then run:

```bash
npm run test:juice-shop
```

The adapter defaults to `http://127.0.0.1:3000`; override it with `JUICE_SHOP_BASE_URL` if your local instance uses another address. This dedicated, read-only spec checks the product catalog UI and product-search API. It does not run the generic `/users` API suite or perform security challenges, login attempts, or data mutations against Juice Shop.

The Playwright configuration runs projects fully in parallel by default. `PROCESS.md` describes a recommended manual triage order; it is not an enforced sequential CI gate. CI installs Chromium and runs isolated helper tests plus discovery; app-dependent suites require a configured target and are not run by default.

### Safe API mutation testing

The create/update/delete lifecycle and invalid-create test are skipped by default. Run them only against a disposable test environment by setting both variables to the exact API base URL:

```text
ALLOW_API_MUTATIONS=true
API_MUTATION_TARGET=https://your-test-app.example/api
```

Create, update, and delete run as separate tests. Each creates its own uniquely named resource, verifies the specific operation, and attempts cleanup if an assertion fails. Never enable these against production data.

### Optional tenant isolation

To run the tenant isolation test, configure all four values using separate test identities and a known record path belonging to each tenant:

```text
TENANT_A_TOKEN=<tenant-a-test-token>
TENANT_A_RESOURCE_PATH=/tenants/a/records/known-id
TENANT_B_TOKEN=<tenant-b-test-token>
TENANT_B_RESOURCE_PATH=/tenants/b/records/known-id
```

The test verifies each identity can read its own resource and receives `403` or `404` when requesting the other tenant’s resource. It does not test export limits or pricing authorization. Keep tokens out of source control.

## Live-site example

`tests/idavidov.spec.ts` is an explicitly scoped public-site example. In the latest v1.1 validation, 3 of 5 checks passed and 2 failed: the homepage response was missing all five configured security headers, and axe found a critical invalid `aria-controls` reference on a “Load more posts” button. Header validation and the axe scan run independently, so both findings are visible in one run. See `LIVE_SITE_REPORT.md` for details and rerun the spec for current results:

```bash
npx playwright test tests/idavidov.spec.ts --project=chromium
```

## Repository guide

- `TECHDOC.md` — technical design and test behavior
- `CHECKLIST.md` — QA execution and release checklist
- `ARCHITECTURE.md` — architecture diagram
- `PROCESS.md` — recommended manual QA workflow
- `MASTER_GUIDE.md` — consolidated guide
- `LIVE_SITE_REPORT.md` — historical live-site observations
- `JUICE_SHOP_ADAPTER.md` — local Juice Shop adapter and test scope

## Version and license

Current project version: **1.1.0**
License: **ISC** (see `LICENSE`).

Repository: https://github.com/Mikikem87/crosssqa-v1
