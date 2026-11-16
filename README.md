# CrossSQA

Reusable Playwright + TypeScript QA framework for cross-site UI and API testing.

## Structure

- `playwright.config.ts` – browser and viewport matrix
- `tests/config/site.config.ts` – site adapter and environment-driven config
- `tests/helpers/qa.ts` – reusable assertions and checks
- `tests/pages/*` – page objects
- `tests/fixtures/testData.ts` – data builders for API and UI checks
- `tests/smoke.spec.ts` – core smoke/regression tests
- `tests/security.spec.ts` – security and route checks
- `tests/accessibility.spec.ts` – axe, keyboard, structure, skip-links, contrast, and reduced-motion checks
- `tests/api.spec.ts` – API contract and regression checks
- `tests/helpers/auth.ts` – reusable login/logout flow
- `tests/helpers/api.ts` – reusable API assertion helpers
- `tests/fixtures/testData.ts` – valid/invalid payload generators

## Required environment

Set the app-specific values before running the suite:

```bash
BASE_URL=http://localhost:3000
LOGIN_PATH=/login
LOGIN_EMAIL_SELECTOR=#email
LOGIN_PASSWORD_SELECTOR=#password
PROTECTED_PATH=/dashboard
EXPECTED_TITLE_TEXT="My App"
API_BASE_URL=http://localhost:3000/api
```

## Must-pass vs site-specific checks

This suite is intentionally split between universal checks and site-specific adapter values.

- Must-pass checks: smoke, accessibility, security, API contract basics, keyboard and focus flow checks
- Site-specific checks: route names, expected texts, auth selectors, protected pages, app titles, domain-specific nav/menu behavior

## Example adapter

```ts
export const siteAdapter = {
  baseURL: 'http://localhost:3000',
  expectedTitleText: 'My App',
  requiredRoutes: [
    { path: '/', name: 'home', expectedText: ['Welcome'], expectedHeading: 'Home' },
    { path: '/login', name: 'login', expectedText: ['Login'], expectedHeading: 'Login' },
  ],
  loginPage: {
    path: '/login',
    emailSelector: '#email',
    passwordSelector: '#password',
  },
  protectedPage: {
    path: '/dashboard',
    expectedTitleText: 'Dashboard',
  },
  auth: {
    loginPath: '/login',
    emailSelector: '#email',
    passwordSelector: '#password',
  },
  api: {
    baseURL: 'http://localhost:3000/api',
    healthPath: '/health',
    listPath: '/users',
    createPath: '/users',
  },
};
```

## Commands

```bash
npx playwright test
npx playwright test tests/smoke.spec.ts
npx playwright test tests/security.spec.ts
npx playwright test tests/accessibility.spec.ts
npx playwright test tests/api.spec.ts
npx playwright test tests/idavidov.spec.ts --project=chromium
```

## Live-site validation example

The framework was validated against `https://idavidov.eu` to confirm it works on a real public site, not only a local mock environment.

Current result on the live site:

- 3/4 checks passed
- 1 check failed: missing `Content-Security-Policy` and related security headers on the homepage

This is a useful finding because it demonstrates that the suite can catch a real-world security issue and is not only validating placeholder pages.
