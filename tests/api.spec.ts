import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { getSiteConfig } from './config/site.config';
import { buildInvalidUser, buildUser } from './fixtures/testData';

const config = getSiteConfig();
const jsonContentType = /application\/json/i;

function getUrl(path: string) {
  return `${config.api.baseURL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function getRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Expected the API response to contain a JSON object.');
  }
  const record = body as Record<string, unknown>;
  const data = record.data;
  return data && typeof data === 'object' && !Array.isArray(data)
    ? data as Record<string, unknown>
    : record;
}

function getResourceId(body: unknown): string {
  const record = getRecord(body);
  const id = record.id ?? record.userId ?? record.uuid;
  if (id === undefined || id === null || String(id).length === 0) {
    throw new Error('The API response did not include a resource identifier.');
  }
  return String(id);
}

function getCollection(body: unknown, itemsPath?: string): unknown[] {
  let value: unknown = body;
  if (itemsPath) {
    for (const key of itemsPath.split('.')) {
      value = value && typeof value === 'object'
        ? (value as Record<string, unknown>)[key]
        : undefined;
    }
  } else if (body && typeof body === 'object' && !Array.isArray(body)) {
    const record = body as Record<string, unknown>;
    value = record.data ?? record.items;
  }

  if (!Array.isArray(value)) {
    throw new Error('Expected the list API response to contain an array.');
  }
  return value;
}

function getResourceUrl(id: string) {
  const template = config.api.resourcePathTemplate;
  if (!template?.includes('{id}')) {
    throw new Error('API_RESOURCE_PATH_TEMPLATE must contain the {id} placeholder for mutation tests.');
  }
  return getUrl(template.replace('{id}', encodeURIComponent(id)));
}

async function createDisposableUser(request: import('@playwright/test').APIRequestContext) {
  const email = `crosssqa-${randomUUID()}@example.test`;
  const response = await request.post(getUrl(config.api.createPath ?? '/users'), {
    data: buildUser({ email }),
  });
  const body: unknown = response.ok() ? await response.json().catch(() => null) : null;
  const resourceUrl = body ? getResourceUrl(getResourceId(body)) : undefined;
  return { email, response, resourceUrl };
}

async function cleanupDisposableResource(
  request: import('@playwright/test').APIRequestContext,
  resourceUrl: string | undefined,
) {
  if (!resourceUrl) {
    return;
  }
  const response = await request.delete(resourceUrl);
  expect(
    [...config.api.deletedStatuses, 404],
    `Cleanup should delete or confirm absence of ${resourceUrl}`,
  ).toContain(response.status());
}

test.describe('API contract and regression checks', () => {
  test('health endpoint responds with a successful status', async ({ request }) => {
    const response = await request.get(getUrl(config.api.healthPath ?? '/health'));
    expect([200, 204]).toContain(response.status());
  });

  test('list endpoint returns a JSON array', async ({ request }) => {
    const response = await request.get(getUrl(config.api.listPath ?? '/users'));
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type'] ?? '').toMatch(jsonContentType);
    const body = await response.json();
    expect(Array.isArray(getCollection(body))).toBeTruthy();
  });

  test('configured detail endpoint returns an existing resource', async ({ request }) => {
    const response = await request.get(getUrl(config.api.detailPath ?? '/users/1'));
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type'] ?? '').toMatch(jsonContentType);
    const body = getRecord(await response.json());
    expect(body.id ?? body.userId ?? body.uuid, 'Resource response must expose an identifier').toBeTruthy();
  });

  test('configured missing detail endpoint returns 404', async ({ request }) => {
    test.skip(!config.api.missingDetailPath, 'Set API_MISSING_DETAIL_PATH to a known non-existent resource.');
    const response = await request.get(getUrl(config.api.missingDetailPath!));
    expect(response.status()).toBe(404);
  });

  test('protected API profile rejects unauthenticated access', async ({ request }) => {
    test.skip(!config.api.profilePath, 'Set API_PROFILE_PATH to an endpoint that requires authentication.');
    const response = await request.get(getUrl(config.api.profilePath!));
    expect([401, 403]).toContain(response.status());
  });

  test('configured pagination respects the requested limit and sort order', async ({ request }) => {
    const pagination = config.api.pagination;
    test.skip(!pagination, 'Configure pagination parameters, page size, sort field, and order for this API.');

    const url = new URL(getUrl(config.api.listPath ?? '/users'));
    url.searchParams.set(pagination!.pageParameter, '1');
    url.searchParams.set(pagination!.pageSizeParameter, String(pagination!.pageSize));
    url.searchParams.set(pagination!.sortParameter, pagination!.sortField);
    url.searchParams.set(pagination!.orderParameter, pagination!.order);

    const response = await request.get(url.toString());
    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    const items = getCollection(body, pagination!.itemsPath);
    expect(items.length, 'The endpoint must not exceed the requested page size').toBeLessThanOrEqual(pagination!.pageSize);
    expect(items.length, 'At least two records are needed to verify sort order').toBeGreaterThanOrEqual(2);
    expect(readPath(body, pagination!.pageMetadataPath), 'Response metadata should report the requested page')
      .toBe(1);
    expect(readPath(body, pagination!.pageSizeMetadataPath), 'Response metadata should report the requested page size')
      .toBe(pagination!.pageSize);
    expect(readPath(body, pagination!.totalMetadataPath), 'Response metadata should include a total record count')
      .toBeGreaterThanOrEqual(items.length);

    const values = items.map((item) => {
      if (!item || typeof item !== 'object') {
        throw new Error('Expected each paginated item to be an object.');
      }
      const value = (item as Record<string, unknown>)[pagination!.sortField];
      if (value === undefined || value === null) {
        throw new Error(`The configured sort field "${pagination!.sortField}" is absent from an item.`);
      }
      return value;
    });

    for (let i = 1; i < values.length; i += 1) {
      const previous = values[i - 1];
      const current = values[i];
      const comparison = typeof previous === 'number' && typeof current === 'number'
        ? previous - current
        : String(previous).localeCompare(String(current));
      expect(pagination!.order === 'asc' ? comparison <= 0 : comparison >= 0).toBeTruthy();
    }
  });

  test('valid create returns the configured success status and persists the new resource', async ({ request }) => {
    test.skip(!config.api.mutationsEnabled, 'Set ALLOW_API_MUTATIONS=true and API_MUTATION_TARGET to the exact API base URL of a disposable test environment.');

    const created = await createDisposableUser(request);
    try {
      expect(config.api.createdStatuses).toContain(created.response.status());
      expect(created.resourceUrl, 'Create response must include the new resource ID').toBeTruthy();
      const readBackResponse = await request.get(created.resourceUrl!);
      expect(readBackResponse.status()).toBe(200);
      const readBackBody = getRecord(await readBackResponse.json());
      expect(readBackBody.email).toBe(created.email);
    } finally {
      await cleanupDisposableResource(request, created.resourceUrl);
    }
  });

  test('valid update changes a resource created by this test', async ({ request }) => {
    test.skip(!config.api.mutationsEnabled, 'Set ALLOW_API_MUTATIONS=true and API_MUTATION_TARGET to the exact API base URL of a disposable test environment.');

    const created = await createDisposableUser(request);
    try {
      expect(config.api.createdStatuses).toContain(created.response.status());
      expect(created.resourceUrl, 'Create response must include the new resource ID').toBeTruthy();

      const updateResponse = await request.patch(created.resourceUrl!, {
        data: { name: 'CrossSQA Updated QA User' },
      });
      expect(config.api.updatedStatuses).toContain(updateResponse.status());

      const readBackResponse = await request.get(created.resourceUrl!);
      expect(readBackResponse.status()).toBe(200);
      expect(getRecord(await readBackResponse.json()).name).toBe('CrossSQA Updated QA User');
    } finally {
      await cleanupDisposableResource(request, created.resourceUrl);
    }
  });

  test('valid delete removes a resource created by this test', async ({ request }) => {
    test.skip(!config.api.mutationsEnabled, 'Set ALLOW_API_MUTATIONS=true and API_MUTATION_TARGET to the exact API base URL of a disposable test environment.');

    const created = await createDisposableUser(request);
    let confirmedDeleted = false;
    try {
      expect(config.api.createdStatuses).toContain(created.response.status());
      expect(created.resourceUrl, 'Create response must include the new resource ID').toBeTruthy();

      const deleteResponse = await request.delete(created.resourceUrl!);
      expect(config.api.deletedStatuses).toContain(deleteResponse.status());

      const readAfterDelete = await request.get(created.resourceUrl!);
      expect(readAfterDelete.status(), 'Deleted resource should no longer be readable').toBe(404);
      confirmedDeleted = true;
    } finally {
      if (!confirmedDeleted) {
        await cleanupDisposableResource(request, created.resourceUrl);
      }
    }
  });

  test('invalid create payload is rejected without creating a resource', async ({ request }) => {
    test.skip(!config.api.mutationsEnabled, 'Set ALLOW_API_MUTATIONS=true and API_MUTATION_TARGET to the exact API base URL of a disposable test environment.');

    const response = await request.post(getUrl(config.api.createPath ?? '/users'), { data: buildInvalidUser() });
    const body = response.ok() ? await response.json().catch(() => null) : null;
    let createdResourceUrl: string | undefined;
    try {
      if (body) {
        createdResourceUrl = getResourceUrl(getResourceId(body));
      }
      expect([400, 422]).toContain(response.status());
    } finally {
      if (createdResourceUrl) {
        const cleanupResponse = await request.delete(createdResourceUrl);
        expect(config.api.deletedStatuses, 'Cleanup of unexpectedly accepted invalid data failed')
          .toContain(cleanupResponse.status());
      }
    }
  });
});

function readPath(body: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, body);
}
