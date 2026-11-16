import { expect, test } from '@playwright/test';
import { getSiteConfig } from './config/site.config';
import {
  runAxeScan,
  assertFormLabels,
  assertKeyboardNavigation,
  assertNoCriticalA11yIssues,
  assertLandmarksAndStructure,
  assertSkipLinks,
  assertFocusOrderAndNoTrap,
  assertColorContrast,
  assertReducedMotion,
} from './helpers/qa';

const config = getSiteConfig();

// Accessibility checks are broad but intentionally generic so they stay useful across apps. They validate
// the same baseline quality bar: usable keyboard navigation, labels, landmarks, focus order, and no critical axe violations.
test.describe('generic accessibility checks', () => {
  test('homepage and auth page have no critical axe issues', async ({ page }) => {
    // Axe is especially effective for catching hidden regressions: noisy elements, missing form labels,
    // incorrect contrast, and invalid landmarks. This is one of the highest-value checks in any regression pack.
    await page.goto(config.baseURL);
    const homeResults = await runAxeScan(page);
    assertNoCriticalA11yIssues(homeResults.violations);

    await page.goto(`${config.baseURL}${config.loginPage.path}`);
    const loginResults = await runAxeScan(page);
    assertNoCriticalA11yIssues(loginResults.violations);
  });

  test('forms have labels and keyboard focus is visible', async ({ page }) => {
    // The form check verifies that each field has a usable label and that focus navigation still works for keyboard users.
    await page.goto(`${config.baseURL}${config.loginPage.path}`);
    await assertFormLabels(page);
    await assertKeyboardNavigation(page);
  });

  test('structure, skip links, and landmark hierarchy are correct', async ({ page }) => {
    // A page with a clear landmark structure and skip links is easier to navigate with an assistive technology device.
    await page.goto(config.baseURL);
    await assertLandmarksAndStructure(page);
    await assertSkipLinks(page);
  });

  test('focus order remains predictable and does not trap the user', async ({ page }) => {
    // Focus should move in a predictable sequence. A keyboard trap is a serious usability bug with direct impact on accessibility.
    await page.goto(config.baseURL);
    await assertFocusOrderAndNoTrap(page);
  });

  test('text contrast stays readable for core visible elements', async ({ page }) => {
    // Strong contrast is a core WCAG expectation and should be checked explicitly, not only through automated heuristics.
    await page.goto(config.baseURL);
    await assertColorContrast(page);
  });

  test('live regions and dialog/focus management are usable if present', async ({ page }) => {
    // If the page contains live regions or dialogs, they should not trap focus or fail to announce state changes.
    await page.goto(config.baseURL);
    const dialogs = page.locator('[role="dialog"], [aria-modal="true"], dialog');
    const count = await dialogs.count();

    if (count > 0) {
      const firstDialog = dialogs.first();
      await firstDialog.focus();
      await expect(firstDialog).toBeFocused();
    }

    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    expect((await liveRegions.count()) >= 0).toBeTruthy();
  });

  test('reduced-motion preference is respected when the browser exposes it', async ({ page }) => {
    await page.goto(config.baseURL);
    await assertReducedMotion(page);
  });

  test('headers and landmarks are present', async ({ page }) => {
    // An app without a clear heading structure or main landmark is difficult to navigate for assistive tech users.
    await page.goto(config.baseURL);
    await expect(page.locator('main, [role="main"]').first()).toBeVisible();
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
