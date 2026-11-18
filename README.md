# CrossSQA

Reusable Playwright + TypeScript QA framework for smoke, security, accessibility, and API testing across multiple web applications.

## Overview

CrossSQA is a reusable QA automation project designed to validate web apps across:
- desktop browsers
- mobile viewports
- tablet viewports
- key user journeys
- security baseline checks
- accessibility checks
- API regression coverage

The framework follows a site-adapter pattern so the test logic stays generic while app-specific values such as routes, selectors, auth flow, and expected content are kept in one configuration layer.

## Why this project

This project demonstrates practical QA engineering skills in:
- cross-browser testing
- responsive UI validation
- security testing
- accessibility testing
- API contract testing
- reusable test architecture
- real-world validation against a live public site

## Tech stack

- Playwright
- TypeScript
- axe-core
- Node.js

## Key features

### UI testing
- smoke and regression coverage
- page load validation
- console and page error collection
- route and navigation checks
- key heading and text verification
- login and protected-page checks

### Browser coverage
- Chromium
- Firefox
- WebKit
- mobile viewport
- tablet viewport

### Accessibility
- axe scans
- form label validation
- keyboard navigation checks
- landmark and heading structure checks
- focus-order validation
- reduced-motion checks
- skip-link and contrast checks

### Security
- security headers validation
- auth-required route enforcement
- traversal attempt checks
- tenant/export/pricing route checks
- broken route detection

### API testing
- health checks
- list/detail endpoint validation
- create/update/delete coverage
- invalid payload rejection
- auth rejection checks
- pagination and sorting validation

## Architecture

The project is split into logical layers:

- Site adapter config
- Reusable helpers
- Page objects
- Test suites

This keeps the framework flexible and reusable while allowing each app to define its own:
- base URL
- protected routes
- login selectors
- auth flow
- expected texts
- API endpoints

## Project structure

```text
.
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── README.md
├── TECHDOC.md
├── CHECKLIST.md
├── ARCHITECTURE.md
├── PROCESS.md
├── MASTER_GUIDE.md
├── tests/
│   ├── config/
│   │   └── site.config.ts
│   ├── helpers/
│   │   ├── qa.ts
│   │   ├── auth.ts
│   │   └── api.ts
│   ├── pages/
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   └── HomePage.ts
│   ├── fixtures/
│   │   └── testData.ts
│   ├── smoke.spec.ts
│   ├── security.spec.ts
│   ├── accessibility.spec.ts
│   ├── api.spec.ts
│   └── idavidov.spec.ts
└── .gitignore

```

## Getting started

### Install dependencies

```
npm install
```

### Configure the target app

Update the adapter settings in:

```
tests/config/site.config.ts
```
Set values such as:

base URL
required routes
auth selectors
protected routes
API endpoints
expected page content

### Run the full suite
```
npx playwright test
```
### Run specific tests
```
npx playwright test tests/smoke.spec.ts
npx playwright test tests/security.spec.ts
npx playwright test tests/accessibility.spec.ts
npx playwright test tests/api.spec.ts
```
### Run the live-site example
```
npx playwright test tests/idavidov.spec.ts --project=chromium
```
## Real-world validation
The framework was validated against a public website: https://idavidov.eu

Outcome:

3 checks passed
1 check failed

The failing check exposed a real security issue:

missing security headers on the homepage

This demonstrates that the framework is capable of identifying meaningful production risks rather than only validating a happy-path environment.

## Documentation
Project documentation is included in:

- TECHDOC.md
- CHECKLIST.md
- ARCHITECTURE.md
- PROCESS.md
- MASTER_GUIDE.md

## Project status
Current version: v1.0

This project is designed as a reusable QA foundation that can be adapted to different web applications and used as a strong portfolio piece for QA automation roles.

## License
For portfolio and demonstration purposes.

## Repository
GitHub:

https://github.com/Mikikem87/crosssqa-v1
