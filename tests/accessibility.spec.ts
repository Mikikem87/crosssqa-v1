import { expect, test } from '@playwright/test';
import { getSiteConfig } from './config/site.config';
import {
  runAxeScan,
  assertFormLabels,
  assertKeyboardNavigation,
  assertNoCriticalA11yIssues,
  assertLandmarksAndStructure,
  assertSkipLinks,
  assertReducedMotionPreference,
} from './helpers/qa';

const config = getSiteConfig();

test.describe('accessibility checks', () => {
  test('homepage has no critical axe violations', async ({ page }) => {
    await page.goto(config.baseURL);
    const results = await runAxeScan(page);
    assertNoCriticalA11yIssues(results.violations);
  });

  test('login page has no critical axe violations', async ({ page }) => {
    await page.goto(new URL(config.loginPage.path, config.baseURL).toString());
    const results = await runAxeScan(page);
    assertNoCriticalA11yIssues(results.violations);
  });

  test('form controls have accessible names and receive focus through Tab', async ({ page }) => {
    await page.goto(new URL(config.loginPage.path, config.baseURL).toString());
    await assertFormLabels(page);
    await assertKeyboardNavigation(page);
  });

  test('landmarks and heading structure are present; skip links work if provided', async ({ page }) => {
    await page.goto(config.baseURL);
    await assertLandmarksAndStructure(page);
    await assertSkipLinks(page);
  });

  test('live regions use valid announcement semantics when present', async ({ page }) => {
    await page.goto(config.baseURL);
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    const count = await liveRegions.count();
    test.skip(count === 0, 'No live regions are present on this page.');

    for (let i = 0; i < count; i += 1) {
      const region = liveRegions.nth(i);
      const role = await region.getAttribute('role');
      const ariaLive = await region.getAttribute('aria-live');
      if (ariaLive) {
        expect(['off', 'polite', 'assertive']).toContain(ariaLive);
      }
      if (role === 'status' && ariaLive) {
        expect(ariaLive).toBe('polite');
      }
      if (role === 'alert' && ariaLive) {
        expect(ariaLive).toBe('assertive');
      }
    }
  });

  test('visible dialogs have an accessible label', async ({ page }) => {
    await page.goto(config.baseURL);
    const dialogs = page.locator('[role="dialog"]:visible, dialog[open]:visible');
    const count = await dialogs.count();
    test.skip(count === 0, 'No visible dialogs are present on this page.');

    for (let i = 0; i < count; i += 1) {
      const dialog = dialogs.nth(i);
      const hasAccessibleName = await dialog.evaluate((element) => {
        const label = element.getAttribute('aria-label')?.trim();
        const labelledBy = (element.getAttribute('aria-labelledby') ?? '')
          .split(/\s+/)
          .filter(Boolean)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
          .join(' ')
          .trim();
        return Boolean(label || labelledBy);
      });
      expect(hasAccessibleName, 'Visible dialogs should have an aria-label or aria-labelledby').toBeTruthy();
    }
  });

  test('browser can emulate the reduced-motion preference', async ({ page }) => {
    await assertReducedMotionPreference(page);
  });

  test('homepage exposes a main landmark and a heading', async ({ page }) => {
    await page.goto(config.baseURL);
    await expect(page.locator('main, [role="main"]').first()).toBeVisible();
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
