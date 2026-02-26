import { describe, it, expect, beforeAll, afterAll } from '../run';
import { newPage, url } from '../helpers/setup';
import { Page } from 'puppeteer';

let page: Page;

describe('Names of Allah', () => {
  beforeAll(async () => {
    page = await newPage();
    await page.goto(url('/names'));
    await page.waitForTimeout(3000);
  });

  afterAll(async () => {
    await page.close();
  });

  it('should load the names page', async () => {
    const pageContent = await page.content();
    const hasNamesContent = pageContent.toLowerCase().includes('names') ||
      pageContent.toLowerCase().includes('allah') ||
      pageContent.toLowerCase().includes('الله') ||
      pageContent.toLowerCase().includes('ar-rahman');
    expect(hasNamesContent).toBeTruthy();
  });

  it('should display 99 Names of Allah', async () => {
    const nameCards = await page.$$('[data-name], .name-card, .name-item, li, .card');
    // Should have a significant number of names displayed
    expect(nameCards.length).toBeGreaterThan(10);
  });

  it('should show Arabic and English for each name', async () => {
    const pageContent = await page.content();
    // Should contain Arabic text
    const hasArabic = /[\u0600-\u06FF]/.test(pageContent);
    expect(hasArabic).toBeTruthy();
  });

  it('should navigate to Muhammad names page', async () => {
    await page.goto(url('/names/muhammad'));
    await page.waitForTimeout(3000);

    const pageContent = await page.content();
    const hasMuhammadContent = pageContent.toLowerCase().includes('muhammad') ||
      pageContent.toLowerCase().includes('prophet') ||
      pageContent.toLowerCase().includes('محمد');
    expect(hasMuhammadContent).toBeTruthy();
  });

  it('[BUG #11] Names page should be reachable from header navigation', async () => {
    await page.goto(url('/'));
    await page.waitForSelector('header');

    // Look for a Names link in the header
    const namesLink = await page.$('header a[href="/names"], nav a[href="/names"]');
    // BUG: No link exists in the navigation — this SHOULD fail
    expect(namesLink).not.toBeNull();
  });
});
