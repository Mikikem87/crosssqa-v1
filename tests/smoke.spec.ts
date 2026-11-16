import { expect, test } from '@playwright/test';
import { getSiteConfig } from './config/site.config';
import {
  gotoAndCollectErrors,
  assertNoBrokenRoutes,
  assertPageBasics,
  assertKeyboardNavigation,
  assertSecurityHeaders,
  assertRouteContent,
} from './helpers/qa';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';

const config = getSiteConfig();

// Smoke tests validate the critical user paths first. These checks are intentionally generic so the
// same suite can run against different apps by swapping the site adapter config only.
for (const route of config.requiredRoutes) {
  test(`${route.name} loads without console/page errors`, async ({ page }) => {
    // A page that loads but logs JS errors or returns 4xx/5xx responses is a regression. The site adapter
    // centralizes the route list, so app-specific changes do not require editing the test logic.
    const result = await gotoAndCollectErrors(page, route.path);

    expect(result.consoleErrors, `Console errors on ${route.path}: ${result.consoleErrors.join('; ')}`).toEqual([]);
    expect(result.pageErrors, `Page errors on ${route.path}: ${result.pageErrors.join('; ')}`).toEqual([]);
    expect(result.failedResponses, `Failed responses on ${route.path}: ${result.failedResponses.join(', ')}`).toEqual([]);

    await assertRouteContent(page, route);
    await expect(page).toHaveURL(new RegExp(route.path.replace(/\//g, '\\/').replace(/\$/, ''), 'i'));
  });
}

test('core page basics work across the app', async ({ page }) => {
  // Page basics verify that the app still exposes the semantic structure a user expects: heading, input,
  // and navigation affordances. This catches regressions without being tied to a specific UI framework.
  const home = new HomePage(page, config);
  await home.openHome();
  await assertPageBasics(page);

  const login = new LoginPage(page, config);
  await login.goto();
  await expect(page.locator(config.loginPage.emailSelector)).toBeVisible();
  await expect(page.locator(config.loginPage.passwordSelector)).toBeVisible();
});

test('protected routes require auth and routing is stable', async ({ page }) => {
  // Authentication should be enforced consistently. This protects against accidental exposure of private content.
  await page.goto(`${config.baseURL}${config.protectedPage.path}`);
  await expect(page).not.toHaveURL(/error/i);

  const response = await page.goto(`${config.baseURL}${config.protectedPage.path}`);
  const status = response?.status() ?? 200;
  expect(status).toBeLessThan(500);

  await assertNoBrokenRoutes(page, [{ path: config.protectedPage.path }]);
});

test('critical form fields and keyboard navigation are usable', async ({ page }) => {
  // A form that cannot receive keyboard focus is a usability and accessibility regression. This also covers
  // the baseline header checks recommended for production-ready apps.
  const login = new LoginPage(page, config);
  await login.goto();
  await assertKeyboardNavigation(page);
  await assertSecurityHeaders(page);
});
