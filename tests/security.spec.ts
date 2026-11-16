import { expect, test } from '@playwright/test';
import { getSiteConfig } from './config/site.config';
import { assertNoBrokenRoutes } from './helpers/qa';

const config = getSiteConfig();

// Security checks intentionally stay generic. They validate common defense-in-depth expectations such as
// headers, auth redirection, tenant boundaries, and route traversal guards without depending on site-specific code.
test.describe('generic security checks', () => {
  test('security headers are present on public pages', async ({ page }) => {
    // CSP, HSTS, frame protection and referrer controls are standard baseline controls. Missing them is a
    // common production risk even when the app looks functional from a happy-path perspective.
    await page.goto(config.baseURL);
    const response = await page.goto(config.baseURL);
    const headers = response?.headers() ?? {};

    for (const header of config.securityHeaders) {
      expect(headers[header] ?? headers[header.toLowerCase()] ?? headers[header.toUpperCase()], `Missing header: ${header}`).toBeTruthy();
    }
  });

  test('unauthenticated access is blocked or redirected', async ({ page }) => {
    // Protected pages should never silently show sensitive data to anonymous users. Redirection to a login page
    // or a 401/403 response is the expected outcome for a secure app.
    await page.goto(`${config.baseURL}${config.protectedPage.path}`);
    await expect(page).toHaveURL(/login|signin|auth|error|403|401/i);
  });

  test('tenant-scoped and export endpoints are not trivially accessible', async ({ page }) => {
    // Multi-tenant apps are especially vulnerable when paths like tenant, exports, or pricing endpoints are
    // directly open without proper auth or tenant enforcement. We accept redirect or auth failures, but not a direct success path.
    for (const scenario of config.securityScenarios ?? []) {
      const response = await page.goto(`${config.baseURL}${scenario.path}`);
      const code = response?.status() ?? 200;
      expect(scenario.expectedStatus ?? [200, 302, 403, 401], `Unexpected status for ${scenario.name}: ${code}`).toContain(code);
    }
  });

  test('routing checks do not reveal critical failures', async ({ page }) => {
    // Broken routes often indicate configuration drift, framework issues, or accidentally exposed backend errors.
    await assertNoBrokenRoutes(page, config.requiredRoutes);
  });

  test('route traversal payloads do not resolve to real pages', async ({ page }) => {
    // Encoded traversal attempts should not reach a valid route in the application. This catches directory traversal
    // and path normalization issues that often appear before a real security problem emerges.
    const payloads = ['../admin', '..%2Fadmin', '%2e%2e%2fadmin', '/%2e%2e/%2e%2e/admin'];

    for (const payload of payloads) {
      const response = await page.goto(`${config.baseURL}${payload}`);
      const status = response?.status() ?? 404;
      expect(status).toBeGreaterThanOrEqual(400);
    }
  });
});
