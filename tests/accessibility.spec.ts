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
  assertLiveRegionAnnouncement,
  assertDialogKeyboardBehavior,
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
    test.skip(!config.accessibility?.liveRegion, 'Configure a trigger, live-region selector, and expected announcement to test a real state change.');
    await assertLiveRegionAnnouncement(page, config.accessibility!.liveRegion!);
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

  test('dialog traps keyboard focus and restores it when closed', async ({ page }) => {
    await page.goto(config.baseURL);
    test.skip(!config.accessibility?.dialog, 'Configure dialog open, dialog, and close selectors to test modal keyboard behavior.');
    await assertDialogKeyboardBehavior(page, config.accessibility!.dialog!);
  });

  test('application honors reduced motion for a configured animation', async ({ page }) => {
    await page.goto(config.baseURL);
    test.skip(!config.accessibility?.reducedMotionProbe, 'Configure a probe element and expected reduced-motion CSS value.');
    await assertReducedMotionPreference(page, config.accessibility!.reducedMotionProbe!);
  });

  test('homepage exposes a main landmark and a heading', async ({ page }) => {
    await page.goto(config.baseURL);
    await expect(page.locator('main, [role="main"]').first()).toBeVisible();
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
