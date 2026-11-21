# CrossSQA Master QA Guide

## Overview

This repository is a reusable Playwright + TypeScript QA framework built for cross-site regression testing. The project is designed to support multiple web applications by keeping the test logic generic and moving app-specific details into a site adapter/config layer.

The purpose is to enable a consistent QA process across different products without rewriting the entire suite for each application.

---

## What this framework covers

The suite focuses on the highest-value checks for modern web apps:

- smoke/regression testing
- security validation
- accessibility testing
- API contract testing
- cross-browser and responsive coverage

This gives a strong production-ready baseline without making the suite too rigid or too app-specific.

---

## Core principles

1. Reusability over duplication
   - Generic assertions and shared helper logic are reused across apps.

2. Adapter-driven configuration
   - Site-specific selectors, routes, and expected texts are stored outside the test logic.

3. Must-pass quality checks
   - Critical user journeys and security boundaries are always tested.

4. Failure-mode focus
   - Tests validate both success paths and safe failure behavior.

5. Cross-browser coverage
   - The same suite runs on desktop, mobile, and tablet viewports.

---

## Repository structure

- `playwright.config.ts`  
  Browser/device matrix and Playwright runtime config.

- `tests/config/site.config.ts`  
  Site adapter config for routes, selectors, auth, protected pages, and API paths.

- `tests/helpers/qa.ts`  
  Core UI assertions: console errors, route checks, accessibility, security headers, keyboard checks.

- `tests/helpers/auth.ts`  
  Reusable login/logout flow.

- `tests/helpers/api.ts`  
  Shared API assertions and schema validation helpers.

- `tests/pages/*`  
  Page objects for Login, Home, and common navigation.

- `tests/fixtures/testData.ts`  
  Reusable valid/invalid payload fixtures.

- `tests/smoke.spec.ts`  
  Core smoke and regression checks.

- `tests/security.spec.ts`  
  Security checks for headers, configured auth behavior, and optional tenant boundaries.

- `tests/accessibility.spec.ts`  
  Axe, form label, and keyboard accessibility checks.

- `tests/api.spec.ts`  
  API contract and regression suite.

- `tests/config/juice-shop.config.ts` and `tests/juice-shop.spec.ts`
  Isolated, read-only adapter and smoke/API checks for a locally running OWASP Juice Shop.

- `TECHDOC.md`  
  Detailed technical deep dive.

- `CHECKLIST.md`  
  QA execution checklist.

- `ARCHITECTURE.md`  
  Architecture diagram and overview.

- `PROCESS.md`  
  Execution flow and sign-off process.

---

## Architecture in one sentence

The framework separates app-specific configuration from generic test logic, which allows the same suite to run across different products while keeping the quality bar consistent.

---

## Why the adapter pattern matters

A project-specific suite often hardcodes selectors and page text. That makes it hard to reuse and easy to break when the app changes.

This framework solves that by using a site adapter contract:

- `requiredRoutes`
- `loginPage`
- `protectedPage`
- `expectedTitleText`
- `securityHeaders`
- `auth`
- `api`

The tests consume config instead of hardcoded values. This makes the suite portable across apps while keeping the logic reused.

---

## Smoke/regression coverage

The smoke suite validates the app’s most critical paths:

- route loads without console errors
- no JavaScript page errors
- no failed responses on critical pages
- expected headings and text appear
- core page semantics still exist
- form controls stay keyboard usable

This is the first barrier before deeper checks.

---

## Security coverage

The security suite validates:

- presence of security headers
- rejection or configured login redirect for anonymous protected-page access
- tenant isolation when separate tenant identities and resources are configured
- explicitly configured site-specific security route contracts
- broken routes do not reveal internal failures

Generic status checks do not prove tenant isolation, export limits, or authorization; those require app-specific identities, data, and assertions.

---

## Accessibility coverage

Accessibility checks include:

- axe scan on public and login pages
- accessible names for form controls
- real Tab-key navigation checks
- landmarks and heading structure
- critical axe violations
- optional component checks for skip links, live regions, and dialogs

This keeps the suite aligned with modern WCAG-focused quality expectations.
The reduced-motion test verifies browser preference emulation only; it does not prove that every application animation responds to that preference.

---

## API coverage

API tests validate:

- health endpoint availability
- list endpoint JSON array contract
- existing and explicitly configured missing detail resources
- unauthenticated rejection on a configured protected API route
- configured pagination limits and actual sort order
- opt-in CRUD lifecycle using a unique resource and cleanup
- invalid payload rejection

This reduces the risk of broken contracts and stale assumptions in server-side behavior.
Mutation tests require explicit confirmation of the API base URL and should only run on a disposable test environment.

---

## Browser and viewport matrix

The Playwright config runs across:

- chromium
- firefox
- webkit
- mobile-chrome
- tablet-ipad

This catches issues that appear only on different browsers or responsive layouts.

---

## QA process flow

The recommended manual triage order is:

1. Configure the adapter
2. Validate environment and app availability
3. Run smoke suite
4. Run security checks
5. Run accessibility checks
6. Run API checks
7. Review results and triage failures
8. Make release recommendation

The process is documented in `PROCESS.md`.
Playwright uses `fullyParallel: true`; running the full suite does not enforce this sequence.

---

## QA checklist

The project includes a practical checklist in `CHECKLIST.md` covering:

- pre-run setup
- smoke checks
- accessibility checks
- security checks
- API checks
- browser coverage
- release gate and sign-off

---

## Architecture summary

The system is layered like this:

- environment config
- site adapter
- shared helper layer
- page objects / fixtures
- test suite
- Playwright browser matrix

This structure gives a strong quality baseline while staying maintainable and adaptive.

---

## How to use it for a new site

To use this suite on a new app:

1. Set the base URL and API base URL.
2. Update the route list.
3. Update selectors for login and protected pages.
4. Define expected page text and titles.
5. Align API paths with the app contract.
6. Run the suite.

After configuration, the same generic tests can be reused without rewriting the core logic.

---

## Example command list

```bash
npx playwright test
npx playwright test tests/smoke.spec.ts
npx playwright test tests/security.spec.ts
npx playwright test tests/accessibility.spec.ts
npx playwright test tests/api.spec.ts
```

The GitHub Actions workflow runs TypeScript type checking and Playwright test discovery only. It does not execute app-dependent tests.

---

## Conclusion

This repository is a reusable QA framework for modern web applications. It combines the most important testing disciplines into one maintainable system:

- UI smoke/regression
- security validation
- accessibility checks
- API regression
- browser and viewport coverage

The generic structure makes it scalable, while the adapter pattern allows it to adapt to different products without creating a new suite from scratch.
