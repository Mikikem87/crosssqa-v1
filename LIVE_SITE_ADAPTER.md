# Live Site Adapter Example

This document shows how the generic framework is adapted to a concrete site: `https://idavidov.eu`.

## Adapter config

```ts
export const siteAdapter = {
  baseURL: 'https://idavidov.eu',
  expectedTitleText: 'idavidov.eu',
  requiredRoutes: [
    {
      path: '/',
      name: 'home',
      expectedText: ['Latest articles', 'REST API Testing'],
      expectedHeading: 'Latest articles',
    },
    {
      path: '/rest-api-testing-guide',
      name: 'article',
      expectedText: ['REST API Testing', 'HTTP Methods'],
      expectedHeading: 'REST API Testing: What Every QA Engineer Must Know',
    },
  ],
  loginPage: {
    path: '/login',
    emailSelector: '#email',
    passwordSelector: '#password',
    submitSelector: 'button[type="submit"]',
  },
  protectedPage: {
    path: '/dashboard',
    expectedTitleText: 'Dashboard',
  },
  securityHeaders: [
    'content-security-policy',
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
  ],
  auth: {
    loginPath: '/login',
    emailSelector: '#email',
    passwordSelector: '#password',
  },
  api: {
    baseURL: 'https://idavidov.eu/api',
    healthPath: '/health',
    listPath: '/posts',
    detailPath: '/posts/1',
    createPath: '/posts',
    updatePath: '/posts/1',
    deletePath: '/posts/1',
    authPath: '/auth/login',
    profilePath: '/profile',
  },
};
```

## Live test coverage used

The live test file validates:

- homepage loads without console errors
- article page loads without console errors
- no critical axe violations
- keyboard navigation works
- security headers are present

The real site validation also exposed a finding:

- homepage is missing a CSP / frame / content-type security header

This is exactly the type of finding the regression framework is meant to surface.
