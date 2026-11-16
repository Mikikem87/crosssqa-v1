import { expect, Page } from '@playwright/test';
import { SiteAdapter } from '../config/site.config';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly email = this.page.locator(this.config.loginPage.emailSelector);
  readonly password = this.page.locator(this.config.loginPage.passwordSelector);
  readonly submit = this.page.locator(this.config.loginPage.submitSelector ?? 'button[type="submit"], input[type="submit"]');

  constructor(page: Page, config: SiteAdapter) {
    super(page, config);
  }

  async goto() {
    await this.open(this.config.loginPage.path);
  }

  async login(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  async expectLoginErrorShown(message: string) {
    await expect(this.page.getByText(message, { exact: false })).toBeVisible();
  }
}
