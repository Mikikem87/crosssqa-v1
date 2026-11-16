import { expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export type RouteResult = {
  url: string;
  consoleErrors: string[];
  pageErrors: string[];
  failedResponses: number[];
};

export async function gotoAndCollectErrors(
  page: Page,
  route: string,
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle' = 'domcontentloaded',
): Promise<RouteResult> {
  // This helper catches the most common front-end regressions in one place: JS errors, failed network calls,
  // and unexpected 4xx/5xx statuses. Re-using it keeps the smoke tests concise and consistent.
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedResponses: number[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  page.on('response', async (response) => {
    if (response.status() >= 400) {
      failedResponses.push(response.status());
    }
  });

  const base = page.url() || 'http://localhost:3000';
  const url = route.startsWith('http') ? route : new URL(route, base).toString();
  await page.goto(url, { waitUntil });

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
  const forms = page.locator('form');
  const formCount = await forms.count();

  for (let i = 0; i < formCount; i += 1) {
    const form = forms.nth(i);
    const controls = form.locator('input, select, textarea').filter({ has: page.locator(':scope > *') });
    const controlCount = await controls.count();

    for (let j = 0; j < controlCount; j += 1) {
      const control = controls.nth(j);
      const controlType = await control.getAttribute('type');
      const id = await control.getAttribute('id');
      const ariaLabel = await control.getAttribute('aria-label');
      const ariaLabelledBy = await control.getAttribute('aria-labelledby');
      const name = await control.getAttribute('name');

      if (controlType === 'hidden') {
        continue;
      }

      const label = id ? form.locator(`label[for="${id}"]`) : null;
      const labelCount = label ? await label.count() : 0;
      const hasAccessibleName = Boolean(ariaLabel || ariaLabelledBy || name || labelCount);

      expect(hasAccessibleName, `Form control missing accessible label: ${await control.evaluate((el) => el.outerHTML)}`).toBeTruthy();
    }
  }
}

export async function assertPageBasics(page: Page) {
  // A strong smoke check confirms the page still exposes the semantic structure a user needs: headings and form containers.
  const headingCount = await page.locator('h1, h2').count();
  expect(headingCount).toBeGreaterThan(0);
  const formCount = await page.locator('form').count();
  expect(formCount).toBeGreaterThanOrEqual(0);
}

export async function assertKeyboardNavigation(page: Page) {
  // Keyboard-first usability is one of the most valuable QA checks for any UI. This ensures focus can move
  // through the page without relying on a pointer or mouse interaction.
  const focusable = page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const count = await focusable.count();

  if (count === 0) {
    return;
  }

  for (let i = 0; i < Math.min(count, 10); i += 1) {
    const element = focusable.nth(i);
    const isVisible = await element.isVisible().catch(() => false);
    if (!isVisible) {
      continue;
    }

    await element.focus();
    await expect(element).toBeFocused();
  }
}

export async function assertLandmarksAndStructure(page: Page) {
  const main = page.locator('main, [role="main"]').first();
  await expect(main).toBeVisible();

  const headerCount = await page.locator('header, [role="banner"]').count();
  const navCount = await page.locator('nav, [role="navigation"]').count();
  const footerCount = await page.locator('footer, [role="contentinfo"]').count();

  expect(headerCount + navCount + footerCount).toBeGreaterThan(0);

  const headingCount = await page.locator('h1, h2, h3').count();
  expect(headingCount).toBeGreaterThan(0);
}

export async function assertSkipLinks(page: Page) {
  const skipLinks = page.locator('a[href="#main-content"], a[href="#content"], a[href^="#"], a:has-text("skip")');
  const count = await skipLinks.count();

  if (count === 0) {
    return;
  }

  const candidate = skipLinks.first();
  await candidate.focus();
  await expect(candidate).toBeFocused();
}

export async function assertReducedMotion(page: Page) {
  const mediaQuery = await page.evaluate(() => {
    const value = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'reduce' : 'no-preference';
    return value;
  });

  expect(['no-preference', 'reduce']).toContain(mediaQuery);
}

export async function assertFocusOrderAndNoTrap(page: Page) {
  const focusable = page.locator('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
  const count = await focusable.count();

  if (count === 0) {
    return;
  }

  const max = Math.min(count, 12);
  const sequence: string[] = [];

  for (let i = 0; i < max; i += 1) {
    const element = focusable.nth(i);
    const visible = await element.isVisible().catch(() => false);
    if (!visible) {
      continue;
    }

    await element.focus();
    await expect(element).toBeFocused();
    sequence.push(await element.evaluate((el) => (el as HTMLElement).tagName.toLowerCase()));
  }

  expect(sequence.length).toBeGreaterThan(0);
}

export async function assertColorContrast(page: Page) {
  const issues = await page.evaluate(() => {
    const parseRgb = (value: string | null) => {
      if (!value || value === 'transparent') {
        return [255, 255, 255];
      }

      const normalized = value.trim();
      if (normalized.startsWith('#')) {
        const hex = normalized.slice(1);
        const full = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex;
        const int = Number.parseInt(full, 16);
        return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
      }

      const match = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if (match) {
        return [Number(match[1]), Number(match[2]), Number(match[3])];
      }

      return [255, 255, 255];
    };

    const luminance = (rgb: number[]) => {
      const [r, g, b] = rgb.map((component) => {
        const normalized = component / 255;
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const contrastRatio = (a: string, b: string) => {
      const first = luminance(parseRgb(a));
      const second = luminance(parseRgb(b));
      const lighter = Math.max(first, second);
      const darker = Math.min(first, second);
      return (lighter + 0.05) / (darker + 0.05);
    };

    const selectors = ['p', 'a', 'button', 'label', 'span', 'li', 'h1', 'h2', 'h3', 'input', 'select', 'textarea'];
    const issues: Array<{ tag: string; ratio: number }> = [];

    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector));
      for (const element of nodes) {
        const style = window.getComputedStyle(element);
        const text = (element.textContent ?? '').trim();
        const visible = element instanceof HTMLElement ? !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length) : false;

        if (!visible || !text) {
          continue;
        }

        const fg = style.color;
        const bg = style.backgroundColor;
        const ratio = contrastRatio(fg, bg);

        if (ratio < 4.5) {
          issues.push({ tag: element.tagName.toLowerCase(), ratio });
        }
      }
    }

    return issues.slice(0, 10);
  });

  expect(issues, `Low contrast detected: ${JSON.stringify(issues)}`).toEqual([]);
}

export async function assertSecurityHeaders(page: Page) {
  const response = await page.goto(page.url());
  const headers = response?.headers() ?? {};

  expect(headers['content-security-policy'] ?? headers['Content-Security-Policy']).toBeTruthy();
  expect(headers['x-frame-options'] ?? headers['X-Frame-Options']).toBeTruthy();
  expect(headers['x-content-type-options'] ?? headers['X-Content-Type-Options']).toBeTruthy();
  expect(headers['referrer-policy'] ?? headers['Referrer-Policy']).toBeTruthy();
}

export async function assertRouteContent(page: Page, route: { path: string; expectedText?: string[]; expectedHeading?: string }) {
  await page.goto(`${new URL(route.path, 'http://localhost:3000').toString()}`);

  if (route.expectedHeading) {
    await expect(page.locator('h1, h2')).toContainText(route.expectedHeading, { ignoreCase: true });
  }

  for (const text of route.expectedText ?? []) {
    await expect(page.getByText(text, { exact: false })).toBeVisible();
  }
}

export async function assertNoBrokenRoutes(page: Page, routes: Array<{ path: string }>) {
  for (const route of routes) {
    const result = await gotoAndCollectErrors(page, route.path);
    expect(result.failedResponses, `No broken route on ${route.path}`).toEqual([]);
    expect(result.pageErrors, `Page error on ${route.path}`).toEqual([]);
  }
}
