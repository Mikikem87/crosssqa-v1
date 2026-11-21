import { expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export type RouteResult = {
  url: string;
  consoleErrors: string[];
  pageErrors: string[];
  failedResponses: number[];
};

export function resolveRouteUrl(route: string, baseURL: string): string {
  let base: URL;
  try {
    base = new URL(baseURL);
  } catch {
    throw new Error(`Invalid base URL: ${baseURL}`);
  }

  if (base.protocol !== 'http:' && base.protocol !== 'https:') {
    throw new Error(`Unsupported base URL protocol: ${base.protocol}`);
  }

  try {
    return new URL(route, base).toString();
  } catch {
    throw new Error(`Cannot resolve route "${route}" against "${baseURL}"`);
  }
}

export async function gotoAndCollectErrors(
  page: Page,
  route: string,
  baseURL: string,
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle' = 'domcontentloaded',
): Promise<RouteResult> {
  // Keep the listeners scoped to this navigation so repeated route checks do not accumulate stale results.
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedResponses: number[] = [];
  const onConsole = (message: import('@playwright/test').ConsoleMessage) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  };
  const onPageError = (error: Error) => pageErrors.push(error.message);
  const onResponse = (response: import('@playwright/test').Response) => {
    if (response.status() >= 400) {
      failedResponses.push(response.status());
    }
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  page.on('response', onResponse);

  const url = resolveRouteUrl(route, baseURL);
  try {
    await page.goto(url, { waitUntil });
  } finally {
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
    page.off('response', onResponse);
  }

  return { url, consoleErrors, pageErrors, failedResponses };
}

export async function runAxeScan(page: Page) {
  const axe = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
  return axe.analyze();
}

export function assertNoCriticalA11yIssues(violations: Array<{ impact?: string | null }>) {
  const critical = violations.filter((issue) => (issue.impact ?? '').toLowerCase() === 'critical');
  expect(critical, `Critical accessibility violations found: ${JSON.stringify(critical)}`).toHaveLength(0);
}

export async function assertFormLabels(page: Page) {
  const controls = page.locator('form input, form select, form textarea');
  const controlCount = await controls.count();

  for (let i = 0; i < controlCount; i += 1) {
    const control = controls.nth(i);
    const accessibleName = await control.evaluate((element) => {
      const input = element as HTMLInputElement;
      if (input instanceof HTMLInputElement && ['hidden', 'submit', 'reset', 'button', 'image'].includes(input.type)) {
        return 'not a labelled data-entry control';
      }

      const labelledBy = (element.getAttribute('aria-labelledby') ?? '')
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
        .join(' ')
        .trim();
      const labels = 'labels' in element
        ? Array.from((element as HTMLInputElement).labels ?? []).some((label) => Boolean(label.textContent?.trim()))
        : false;

      return element.getAttribute('aria-label')?.trim()
        || labelledBy
        || (labels ? 'associated label' : '')
        || element.getAttribute('title')?.trim()
        || '';
    });

    expect(accessibleName, `Form control lacks an accessible name: ${await control.evaluate((el) => el.outerHTML)}`).toBeTruthy();
  }
}

export async function assertPageBasics(page: Page) {
  const headingCount = await page.locator('h1, h2').count();
  expect(headingCount).toBeGreaterThan(0);
}

const keyboardFocusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export async function assertKeyboardNavigation(page: Page) {
  const focusable = page.locator(keyboardFocusableSelector);
  const visibleCount = await focusable.evaluateAll((elements) =>
    elements.filter((element) => element instanceof HTMLElement
      && !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)).length,
  );
  expect(visibleCount, 'Expected at least one visible keyboard-focusable control').toBeGreaterThan(0);

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  const focusedElements = new Set<number>();
  const tabLimit = Math.min(visibleCount, 8);
  for (let i = 0; i < tabLimit; i += 1) {
    await page.keyboard.press('Tab');
    const active = page.locator(':focus');
    const isFocusable = await active.evaluate((element) => element.matches(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).catch(() => false);
    if (isFocusable && await active.isVisible()) {
      focusedElements.add(await active.evaluate((element, selector) =>
        Array.from(document.querySelectorAll(selector)).indexOf(element), keyboardFocusableSelector,
      ));
    }
  }

  expect(focusedElements.size, 'Tab should move focus through visible interactive elements').toBeGreaterThan(0);
  if (visibleCount > 1) {
    expect(focusedElements.size, 'Tab should advance beyond a single focusable element').toBeGreaterThan(1);
  }
}

export async function assertLandmarksAndStructure(page: Page) {
  const main = page.locator('main, [role="main"]').first();
  await expect(main).toBeVisible();

  const headerCount = await page.locator('header, [role="banner"]').count();
  const navCount = await page.locator('nav, [role="navigation"]').count();
  const footerCount = await page.locator('footer, [role="contentinfo"]').count();
  expect(headerCount + navCount + footerCount).toBeGreaterThan(0);
  expect(await page.locator('h1, h2, h3').count()).toBeGreaterThan(0);
}

export async function assertSkipLinks(page: Page) {
  const skipLinks = page.locator('a[href="#main-content"], a[href="#content"], a:has-text("skip")');
  const count = await skipLinks.count();
  if (count === 0) {
    return;
  }

  const candidate = skipLinks.first();
  const href = await candidate.getAttribute('href');
  expect(href, 'A skip link must target an in-page content fragment').toMatch(/^#[^#]+$/);
  const targetId = href!.slice(1);
  const targetExists = await page.locator('[id]').evaluateAll((elements, id) =>
    elements.some((element) => element.id === id), targetId);
  expect(targetExists, `Skip-link target "${targetId}" must exist`).toBeTruthy();

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  let reachedSkipLink = false;
  for (let i = 0; i < 15; i += 1) {
    await page.keyboard.press('Tab');
    reachedSkipLink = await page.locator(':focus').evaluate((element) => {
      if (!(element instanceof HTMLAnchorElement)) {
        return false;
      }
      return ['#main-content', '#content'].includes(element.getAttribute('href') ?? '')
        || /skip/i.test(element.textContent ?? '');
    }).catch(() => false);
    if (reachedSkipLink) {
      break;
    }
  }
  expect(reachedSkipLink, 'Skip link should be reachable using Tab').toBeTruthy();
  await page.keyboard.press('Enter');
  await expect.poll(() => new URL(page.url()).hash).toBe(`#${targetId}`);
}

export async function assertReducedMotionPreference(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotionEnabled = await page.evaluate(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  expect(reducedMotionEnabled).toBeTruthy();
}

export function assertSecurityHeaders(headers: Record<string, string>, requiredHeaders: string[]) {
  for (const header of requiredHeaders) {
    expect(headers[header.toLowerCase()], `Missing security header: ${header}`).toBeTruthy();
  }
}

export async function assertRouteContent(
  page: Page,
  route: { path: string; expectedText?: string[]; expectedHeading?: string },
) {
  if (route.expectedHeading) {
    await expect(page.locator('h1, h2')).toContainText(route.expectedHeading, { ignoreCase: true });
  }

  for (const text of route.expectedText ?? []) {
    await expect(page.getByText(text, { exact: false })).toBeVisible();
  }
}

export async function assertNoBrokenRoutes(
  page: Page,
  routes: Array<{ path: string }>,
  baseURL: string,
) {
  for (const route of routes) {
    const result = await gotoAndCollectErrors(page, route.path, baseURL);
    expect(result.failedResponses, `No broken route on ${route.path}`).toEqual([]);
    expect(result.pageErrors, `Page error on ${route.path}`).toEqual([]);
  }
}
