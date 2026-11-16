import { Page } from '@playwright/test';
import { getSiteConfig } from '../config/site.config';

export async function loginAsUser(page: Page, email: string, password: string) {
  const config = getSiteConfig();

  await page.goto(`${config.baseURL}${config.loginPage.path}`);
  await page.locator(config.loginPage.emailSelector).fill(email);
  await page.locator(config.loginPage.passwordSelector).fill(password);
  await page.locator(config.loginPage.submitSelector ?? 'button[type="submit"], input[type="submit"]').click();
}

export async function logout(page: Page) {
  const config = getSiteConfig();
  await page.goto(config.baseURL);

  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout"]').first();
  if (await logoutButton.count()) {
    await logoutButton.click();
  }

  await page.goto(`${config.baseURL}${config.loginPage.path}`);
}
