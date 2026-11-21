import { expect, test } from '@playwright/test';
import { resolveRouteUrl } from './qa';

test.describe('route URL resolution', () => {
  test('resolves a relative route against the configured site URL', () => {
    expect(resolveRouteUrl('/account', 'https://qa.example.test')).toBe('https://qa.example.test/account');
  });

  test('preserves an absolute route URL', () => {
    expect(resolveRouteUrl('https://content.example.test/article', 'https://qa.example.test'))
      .toBe('https://content.example.test/article');
  });

  test('rejects invalid base URLs instead of falling back to an unrelated host', () => {
    expect(() => resolveRouteUrl('/account', 'about:blank')).toThrow('Unsupported base URL protocol');
  });
});
