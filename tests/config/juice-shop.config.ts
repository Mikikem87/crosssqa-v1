export type JuiceShopConfig = {
  baseURL: string;
  title: string;
  homePath: string;
  expectedHomeText: string[];
  productSearchPath: string;
  productSearchTerm: string;
  expectedSearchProduct: string;
};

export const juiceShopConfig: JuiceShopConfig = {
  baseURL: process.env.JUICE_SHOP_BASE_URL ?? 'http://127.0.0.1:3000',
  title: 'OWASP Juice Shop',
  homePath: '/',
  expectedHomeText: ['All Products', 'Apple Juice (1000ml)'],
  productSearchPath: '/rest/products/search',
  productSearchTerm: 'apple',
  expectedSearchProduct: 'Apple Juice (1000ml)',
};
