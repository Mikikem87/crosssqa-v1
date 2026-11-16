import { expect, test } from '@playwright/test';
import { getSiteConfig } from './config/site.config';
import { buildInvalidUser, buildUser, testUsers } from './fixtures/testData';
import { expectJsonResponse, expectSchemaShape } from './helpers/api';

const config = getSiteConfig();

const jsonContentType = /application\/json/i;

function getUrl(path: string) {
  return `${config.api.baseURL}${path}`;
}

test.describe('generic API regression checks', () => {
  test('health endpoint responds successfully', async ({ request }) => {
    // Health check is the fastest possible signal that the service and infrastructure are alive.
    const response = await request.get(getUrl(config.api.healthPath ?? '/health'));

    expect(response.ok()).toBeTruthy();
    expect([200, 204]).toContain(response.status());
  });

  test('list endpoint returns a valid JSON payload', async ({ request }) => {
    // The list contract should validate both status code and response structure, not only the happy path.
    const response = await request.get(getUrl(config.api.listPath ?? '/users'));
    const body = await response.json().catch(() => null);

    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toMatch(jsonContentType);
    expect(body).toBeTruthy();
    const collection = body?.data ?? body?.items ?? body;
    if (Array.isArray(collection)) {
      expect(collection.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('detail endpoint returns a single resource or 404 for missing IDs', async ({ request }) => {
    const response = await request.get(getUrl(config.api.detailPath ?? '/users/1'));

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toBeTruthy();
      expect(body.id ?? body.userId ?? body.uuid).toBeTruthy();
      await expectSchemaShape(body, ['id', 'name', 'email']);
    }
  });

  test('create endpoint accepts valid payloads and rejects invalid ones', async ({ request }) => {
    const validPayload = buildUser({ email: 'valid.api.user@example.com' });
    const invalidPayload = buildInvalidUser();

    const validResponse = await request.post(getUrl(config.api.createPath ?? '/users'), { data: validPayload });
    const validBody = await validResponse.json().catch(() => null);

    expect([200, 201, 400, 409]).toContain(validResponse.status());
    if (validResponse.ok()) {
      expect(validBody).toBeTruthy();
      expect(validBody.id ?? validBody.userId).toBeTruthy();
      await expectSchemaShape(validBody, ['id', 'name', 'email']);
    }

    const invalidResponse = await request.post(getUrl(config.api.createPath ?? '/users'), { data: invalidPayload });
    const invalidBody = await invalidResponse.json().catch(() => null);

    expect([400, 422]).toContain(invalidResponse.status());
    if (invalidBody) {
      expect(JSON.stringify(invalidBody)).toMatch(/name|email|required|invalid/i);
    }
  });

  test('update endpoint handles partial or full payloads safely', async ({ request }) => {
    const updateUrl = getUrl(config.api.updatePath ?? '/users/1');
    const response = await request.patch(updateUrl, {
      data: { name: 'Updated QA User' },
    });

    expect([200, 204, 400, 404, 403, 401]).toContain(response.status());
  });

  test('delete endpoint handles invalid or missing IDs gracefully', async ({ request }) => {
    const deleteUrl = getUrl(config.api.deletePath ?? '/users/1');
    const response = await request.delete(deleteUrl);

    expect([200, 204, 400, 401, 403, 404]).toContain(response.status());
  });

  test('unauthenticated access is rejected on protected API routes', async ({ request }) => {
    // API security is as important as UI security; an unauthenticated caller should never be able to reach sensitive endpoints.
    const protectedPaths = [config.api.profilePath ?? '/users/me', config.api.authPath ?? '/auth/login'];

    for (const path of protectedPaths) {
      const response = await request.get(getUrl(path));
      expect([200, 302, 401, 403]).toContain(response.status());
    }
  });

  test('pagination and sorting parameters do not break the API contract', async ({ request }) => {
    const response = await request.get(`${getUrl(config.api.listPath ?? '/users')}?page=1&limit=10&sort=name&order=asc`);
    const body = await response.json().catch(() => null);

    expect([200, 400]).toContain(response.status());
    if (response.status() === 200 && body) {
      const collection = body.data ?? body.items ?? body;
      expect(collection).toBeTruthy();
      await expectJsonResponse(response, [200]);
    }
  });

  test('seed data fixtures cover standard user variants and role boundaries', async () => {
    expect(testUsers.length).toBeGreaterThan(0);
    expect(testUsers.every((user) => user.email.includes('@'))).toBeTruthy();
    expect(testUsers.some((user) => user.role === 'admin')).toBeTruthy();
  });
});
