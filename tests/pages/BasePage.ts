import { Page } from '@playwright/test';
import { SiteAdapter } from '../config/site.config';

export class BasePage {
  constructor(
    protected readonly page: Page,
    protected readonly config: SiteAdapter,
  ) {}

  protected get baseUrl(): string {
    return this.config.baseURL.replace(/\/$/, '');
  }

  protected absolutePath(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalized}`;
  }

  async open(path: string) {
    return this.page.goto(this.absolutePath(path), { waitUntil: 'domcontentloaded' });
  }
}
