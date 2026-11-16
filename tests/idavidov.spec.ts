import { expect, test } from '@playwright/test';
import { gotoAndCollectErrors, runAxeScan, assertNoCriticalA11yIssues, assertKeyboardNavigation } from './helpers/qa';

const baseURL = 'https://idavidov.eu';

const routes = [
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
];

test.describe('idavidov.eu live-site validation', () => {
  for (const route of routes) {
    test(`${route.name} loads without critical issues`, async ({ page }) => {
      const result = await gotoAndCollectErrors(page, `${baseURL}${route.path}`);

      expect(result.consoleErrors, `Console errors on ${route.path}: ${result.consoleErrors.join('; ')}`).toEqual([]);
      expect(result.pageErrors, `Page errors on ${route.path}: ${result.pageErrors.join('; ')}`).toEqual([]);
      expect(result.failedResponses, `Failed responses on ${route.path}: ${result.failedResponses.join(', ')}`).toEqual([]);

      await expect(page.locator('h1, h2').first()).toBeVisible();
      for (const text of route.expectedText) {
        const matches = page.getByText(text, { exact: false });
        await expect(matches.first()).toBeVisible();
      }
    });
  }

  test('homepage has secure headers and no critical axe issues', async ({ page }) => {
    const response = await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    const headers = response?.headers() ?? {};

    const csp = headers['content-security-policy'] ?? headers['Content-Security-Policy'];
    const xfo = headers['x-frame-options'] ?? headers['X-Frame-Options'];
    const xto = headers['x-content-type-options'] ?? headers['X-Content-Type-Options'];

    expect(csp).toBeTruthy();
    expect(xfo).toBeTruthy();
    expect(xto).toBeTruthy();

    const results = await runAxeScan(page);
    assertNoCriticalA11yIssues(results.violations);
  });

  test('homepage remains keyboard usable', async ({ page }) => {
    await page.goto(baseURL);
    await assertKeyboardNavigation(page);
  });
});
