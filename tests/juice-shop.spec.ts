import { expect, test } from '@playwright/test';
import { juiceShopConfig as config } from './config/juice-shop.config';
import { resolveRouteUrl } from './helpers/qa';

type Product = {
  id: number;
  name: string;
  price: number;
};

type ProductSearchResponse = {
  status: string;
  data: Product[];
};

function isProductSearchResponse(body: unknown): body is ProductSearchResponse {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const result = body as Partial<ProductSearchResponse>;
  return result.status === 'success'
    && Array.isArray(result.data)
    && result.data.every((product) =>
      typeof product.id === 'number'
      && typeof product.name === 'string'
      && typeof product.price === 'number',
    );
}

test.describe('OWASP Juice Shop local adapter', () => {
  test('home page loads and displays the configured product catalog', async ({ page }) => {
    const response = await page.goto(resolveRouteUrl(config.homePath, config.baseURL));
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(config.title);

    for (const text of config.expectedHomeText) {
      await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
    }
  });

  test('product search API returns a valid matching product collection', async ({ request }) => {
    const url = new URL(config.productSearchPath, config.baseURL);
    url.searchParams.set('q', config.productSearchTerm);

    const response = await request.get(url.toString());
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type'] ?? '').toMatch(/application\/json/i);

    const body: unknown = await response.json();
    expect(isProductSearchResponse(body), 'Search response should follow the configured product contract').toBeTruthy();

    if (!isProductSearchResponse(body)) {
      throw new Error('Juice Shop product search response did not match the expected JSON shape.');
    }

    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.map((product) => product.name)).toContain(config.expectedSearchProduct);
    expect(body.data.every((product) =>
      product.name.toLowerCase().includes(config.productSearchTerm.toLowerCase()),
    )).toBeTruthy();
  });
});
