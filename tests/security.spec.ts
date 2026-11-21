import { expect, test } from '@playwright/test';
import { getSiteConfig } from './config/site.config';
import { assertNoBrokenRoutes, assertSecurityHeaders, resolveRouteUrl } from './helpers/qa';

const config = getSiteConfig();

test.describe('security baseline checks', () => {
  test('configured security headers are present on the public homepage', async ({ page }) => {
    const response = await page.goto(config.baseURL);
    expect(response, 'Homepage navigation should return an HTTP response').toBeTruthy();
    assertSecurityHeaders(response!.headers(), config.securityHeaders);
  });

  test('anonymous users are rejected or redirected from the protected page', async ({ page }) => {
    const response = await page.goto(resolveRouteUrl(config.protectedPage.path, config.baseURL));
    const status = response?.status();
    const currentPath = new URL(page.url()).pathname.replace(/\/+$/, '') || '/';
    const loginPath = new URL(config.loginPage.path, config.baseURL).pathname.replace(/\/+$/, '') || '/';

    const rejected = status === 401 || status === 403;
    const redirectedToConfiguredLogin = currentPath === loginPath;
    const protectedContent = config.protectedPage.protectedContentSelector
      ? page.locator(config.protectedPage.protectedContentSelector)
      : page.getByText(config.protectedPage.expectedTitleText ?? '', { exact: false });
    expect(
      rejected || redirectedToConfiguredLogin,
      `Expected 401/403 or redirect to ${loginPath}; received status ${status} at ${currentPath}`,
    ).toBeTruthy();
    if (config.protectedPage.expectedTitleText || config.protectedPage.protectedContentSelector) {
      await expect(protectedContent, 'Protected content must not be visible to an anonymous user').toHaveCount(0);
    }
  });

  test('configured security route status contracts are met', async ({ page }) => {
    test.skip(!config.securityScenarios?.length, 'Configure explicit expected statuses for site-specific security routes.');

    for (const scenario of config.securityScenarios ?? []) {
      const response = await page.goto(resolveRouteUrl(scenario.path, config.baseURL));
      expect(response, `Expected an HTTP response for ${scenario.name}`).toBeTruthy();
      expect(
        scenario.expectedStatus,
        `Unexpected status for ${scenario.name}: ${response!.status()}`,
      ).toContain(response!.status());
    }
  });

  test('tenant A and B can access their own records but not each other’s', async ({ request }) => {
    const tenantIsolation = config.api.tenantIsolation;
    test.skip(!tenantIsolation, 'Configure both tenant tokens and resource paths to run tenant-isolation checks.');
    const { tenantA, tenantB } = tenantIsolation!;
    const getResource = (resourcePath: string, token: string) => request.get(
      `${config.api.baseURL.replace(/\/+$/, '')}/${resourcePath.replace(/^\/+/, '')}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const [tenantAOwn, tenantBOwn, tenantAReadsB, tenantBReadsA] = await Promise.all([
      getResource(tenantA.resourcePath, tenantA.token),
      getResource(tenantB.resourcePath, tenantB.token),
      getResource(tenantB.resourcePath, tenantA.token),
      getResource(tenantA.resourcePath, tenantB.token),
    ]);

    expect(tenantAOwn.status(), 'Tenant A should be able to access its own record').toBe(200);
    expect(tenantBOwn.status(), 'Tenant B should be able to access its own record').toBe(200);
    expect([403, 404], 'Tenant A must not access Tenant B’s record').toContain(tenantAReadsB.status());
    expect([403, 404], 'Tenant B must not access Tenant A’s record').toContain(tenantBReadsA.status());
  });

  test('critical routes do not return broken responses or page errors', async ({ page }) => {
    await assertNoBrokenRoutes(page, config.requiredRoutes, config.baseURL);
  });
});
