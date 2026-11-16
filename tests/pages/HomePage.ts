import { expect, Page } from '@playwright/test';
import { SiteAdapter } from '../config/site.config';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  constructor(page: Page, config: SiteAdapter) {
    super(page, config);
  }

  async openHome() {
    return this.page.goto(this.absolutePath(this.config.requiredRoutes[0]?.path ?? '/'), { waitUntil: 'domcontentloaded' });
  }

  async expectStaticContent(expectedText: string[] = []) {
    for (const text of expectedText) {
      await expect(this.page.getByText(text, { exact: false })).toBeVisible();
    }
  }

  async expectPageTitle(expectedTitleText: string) {
    await expect(this.page).toHaveTitle(new RegExp(expectedTitleText, 'i'));
  }
}
