import { APIRequestContext, expect } from '@playwright/test';

export async function expectJsonResponse(response: { status(): number; headers(): Record<string, string>; json: () => Promise<any> }, expectedStatus: number[]) {
  expect(expectedStatus).toContain(response.status());
  expect(response.headers()['content-type'] ?? '').toMatch(/application\/json/i);

  const body = await response.json();
  expect(body).toBeTruthy();
  return body;
}

export async function expectSchemaShape(body: unknown, requiredKeys: string[]) {
  expect(body).toBeTruthy();
  const record = body as Record<string, unknown>;
  for (const key of requiredKeys) {
    expect(record[key]).toBeDefined();
  }
}

export async function getJson(request: APIRequestContext, url: string) {
  const response = await request.get(url);
  return expectJsonResponse(response, [200, 201, 204]);
}
