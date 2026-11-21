import { expect, test } from '@playwright/test';
import {
  assertDialogKeyboardBehavior,
  assertKeyboardNavigation,
  assertLiveRegionAnnouncement,
  assertReducedMotionPreference,
  resolveRouteUrl,
} from './qa';

test.describe('route URL resolution', () => {
  test('resolves root and nested paths against the configured site URL', () => {
    expect(resolveRouteUrl('/', 'https://qa.example.test')).toBe('https://qa.example.test/');
    expect(resolveRouteUrl('/login', 'https://qa.example.test')).toBe('https://qa.example.test/login');
    expect(resolveRouteUrl('/dashboard/settings', 'https://qa.example.test'))
      .toBe('https://qa.example.test/dashboard/settings');
  });

  test('preserves an absolute route URL', () => {
    expect(resolveRouteUrl('https://content.example.test/article', 'https://qa.example.test'))
      .toBe('https://content.example.test/article');
  });

  test('rejects invalid base URLs instead of falling back to an unrelated host', () => {
    expect(() => resolveRouteUrl('/account', 'about:blank')).toThrow('Unsupported base URL protocol');
  });
});

test('keyboard helper records real Tab and Shift+Tab focus movement', async ({ page }) => {
  await page.setContent(`
    <main>
      <a href="#first" id="first">First</a>
      <button id="second" type="button">Second</button>
      <input id="third" aria-label="Third">
    </main>
  `);

  const sequence = await assertKeyboardNavigation(page);
  expect(sequence).toEqual([0, 1, 2]);
});

test('reduced-motion helper verifies a configured computed style', async ({ page }) => {
  await page.setContent(`
    <style>
      #probe { transition: opacity 2s; }
      @media (prefers-reduced-motion: reduce) {
        #probe { transition-duration: 0s; }
      }
    </style>
    <div id="probe">Motion probe</div>
  `);

  await assertReducedMotionPreference(page, {
    selector: '#probe',
    cssProperty: 'transition-duration',
    expectedValue: '0s',
  });
});

test('live-region helper verifies an announcement after a state change', async ({ page }) => {
  await page.setContent(`
    <button id="trigger" onclick="document.querySelector('#status').textContent = 'Saved successfully'">
      Save
    </button>
    <div id="status" role="status" aria-live="polite">Ready</div>
  `);

  await assertLiveRegionAnnouncement(page, {
    triggerSelector: '#trigger',
    regionSelector: '#status',
    expectedText: 'Saved successfully',
  });
});

test('dialog helper verifies focus containment and restoration on close', async ({ page }) => {
  await page.setContent(`
    <button id="open" onclick="document.querySelector('#dialog').showModal()">Open dialog</button>
    <dialog id="dialog" aria-labelledby="dialog-title">
      <h2 id="dialog-title">Dialog title</h2>
      <button id="first">First control</button>
      <button id="close" onclick="document.querySelector('#dialog').close()">Close dialog</button>
    </dialog>
    <script>
      const dialog = document.querySelector('#dialog');
      const opener = document.querySelector('#open');
      dialog.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(dialog.querySelectorAll('button'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
      dialog.addEventListener('close', () => opener.focus());
    </script>
  `);

  await assertDialogKeyboardBehavior(page, {
    openSelector: '#open',
    dialogSelector: '#dialog[open]',
    closeSelector: '#close',
  });
});
