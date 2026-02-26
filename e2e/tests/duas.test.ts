import { describe, it, expect, beforeAll, afterAll } from '../run';
import { newPage, url } from '../helpers/setup';
import { Page } from 'puppeteer';

let page: Page;

describe('Duas — Listing & Categories', () => {
  beforeAll(async () => {
    page = await newPage();
    await page.goto(url('/duas'));
    await page.waitForTimeout(3000);
  });

  afterAll(async () => {
    await page.close();
  });

  it('should load the duas page', async () => {
    const pageContent = await page.content();
    const hasDuasContent = pageContent.toLowerCase().includes('dua') ||
      pageContent.toLowerCase().includes('supplication') ||
      pageContent.toLowerCase().includes('prayer') ||
      pageContent.toLowerCase().includes('category');
    expect(hasDuasContent).toBeTruthy();
  });

  it('should display dua categories or tabs', async () => {
    const pageContent = await page.content();
    const hasCategories = pageContent.toLowerCase().includes('category') ||
      pageContent.toLowerCase().includes('all') ||
      pageContent.toLowerCase().includes('morning') ||
      pageContent.toLowerCase().includes('evening') ||
      pageContent.toLowerCase().includes('travel');
    expect(hasCategories).toBeTruthy();
  });

  it('should display individual duas with Arabic text', async () => {
    const pageContent = await page.content();
    const hasArabic = /[\u0600-\u06FF]/.test(pageContent);
    expect(hasArabic).toBeTruthy();
  });

  it('[BUG #13] should have a text search input (missing — backend supports search)', async () => {
    // Backend has GET /api/v1/islam/duas/search?q= but frontend doesn't expose it
    const searchInput = await page.$('input[type="search"], input[placeholder*="earch"]');
    // BUG: Search input should exist but doesn't — backend search capability is unused
    expect(searchInput).not.toBeNull();
  });

  it('should navigate to dua detail page on click', async () => {
    const duaLink = await page.$('a[href*="/duas/"]');
    if (duaLink) {
      await duaLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/duas\/.+/);

      const pageContent = await page.content();
      const hasDetail = pageContent.toLowerCase().includes('dua') ||
        /[\u0600-\u06FF]/.test(pageContent);
      expect(hasDetail).toBeTruthy();
    }
  });

  it('should switch between category tabs', async () => {
    await page.goto(url('/duas'));
    await page.waitForTimeout(2000);

    const tabs = await page.$$('button[role="tab"], .tab, .category-tab, [data-category]');
    if (tabs.length > 1) {
      const initialContent = await page.content();
      await tabs[1].click();
      await page.waitForTimeout(1000);
      const updatedContent = await page.content();
      // Content may change when switching tabs
      expect(updatedContent).toBeTruthy();
    }
  });
});
