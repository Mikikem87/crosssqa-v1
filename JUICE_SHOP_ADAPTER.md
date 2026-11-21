# OWASP Juice Shop Adapter

This adapter targets a locally running Juice Shop instance and is intentionally separate from the generic site adapter and the `idavidov.eu` live-site example.

## Start the local target

Run Juice Shop with a loopback-only port binding:

```powershell
docker run --rm -d --name juice-shop -p 127.0.0.1:3000:3000 bkimminich/juice-shop
```

The local application is then available at `http://127.0.0.1:3000`. Do not expose this intentionally vulnerable training app to the public internet.

## Run the spec

```bash
npm run test:juice-shop
```

Set `JUICE_SHOP_BASE_URL` to override the default local URL.

## Current coverage

- UI smoke: page response, document title, product catalog heading and a known product.
- API contract: product search returns JSON with `status: "success"` and typed product records.
- Search behavior: returned product names contain the query and include the configured expected result.

The spec is read-only. It does not create accounts, mutate baskets, or attempt Juice Shop security challenges. The generic API suite is not used because its `/users` assumptions do not match Juice Shop's product-search API.

## Adapter settings

`tests/config/juice-shop.config.ts` contains the target URL, expected title and catalog text, and product-search route/query/expected product. Update these settings only when the local Juice Shop version or its API contract changes.
