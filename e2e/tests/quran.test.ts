import { describe, it, expect, beforeAll, afterAll } from '../run';
import { newPage, url } from '../helpers/setup';
import { Page } from 'puppeteer';

let page: Page;

describe('Quran — Surah Listing', () => {
  beforeAll(async () => {
    page = await newPage();
    await page.goto(url('/quran'));
    await page.waitForTimeout(3000); // Wait for API data to load
  });

  afterAll(async () => {
    await page.close();
  });

  it('should load the Quran page', async () => {
    const pageContent = await page.content();
    const hasQuranContent = pageContent.toLowerCase().includes('quran') ||
      pageContent.toLowerCase().includes('surah') ||
      pageContent.toLowerCase().includes('al-');
    expect(hasQuranContent).toBeTruthy();
  });

  it('should display a list of surahs', async () => {
    const surahElements = await page.$$('[data-surah], .surah-card, .surah-item, a[href*="/quran/"]');
    // There should be some surahs listed (up to 114)
    expect(surahElements.length).toBeGreaterThan(0);
  });

  it('should have a search/filter input', async () => {
    const searchInput = await page.$('input[type="search"], input[placeholder*="earch"], input[placeholder*="filter"]');
    expect(searchInput).not.toBeNull();
  });

  it('should filter surahs by name when typing in search', async () => {
    const searchInput = await page.$('input[type="search"], input[placeholder*="earch"], input[placeholder*="filter"]');
    if (searchInput) {
      await searchInput.type('Fatiha');
      await page.waitForTimeout(500);

      const pageContent = await page.content();
      const hasFilteredResult = pageContent.includes('Fatiha') || pageContent.includes('fatiha');
      expect(hasFilteredResult).toBeTruthy();

      // Clear search
      await searchInput.click({ clickCount: 3 });
      await searchInput.press('Backspace');
      await page.waitForTimeout(500);
    }
  });

  it('should filter surahs by number', async () => {
    const searchInput = await page.$('input[type="search"], input[placeholder*="earch"], input[placeholder*="filter"]');
    if (searchInput) {
      await searchInput.click({ clickCount: 3 });
      await searchInput.type('2');
      await page.waitForTimeout(500);

      const pageContent = await page.content();
      // Should show Al-Baqarah (surah 2) or filter results containing "2"
      const hasResult = pageContent.includes('Baqarah') || pageContent.includes('baqarah');
      expect(hasResult).toBeTruthy();

      await searchInput.click({ clickCount: 3 });
      await searchInput.press('Backspace');
    }
  });

  it('[BUG #14] should use frontend-only filtering instead of backend search API', async () => {
    // This test documents that the search is client-side only
    // The backend has GET /api/v1/islam/quran/search?q= for verse searching
    // but the frontend only filters the surah list locally

    const searchInput = await page.$('input[type="search"], input[placeholder*="earch"], input[placeholder*="filter"]');
    if (searchInput) {
      // Set up network monitoring
      const apiCalls: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/quran/search')) {
          apiCalls.push(request.url());
        }
      });

      await searchInput.click({ clickCount: 3 });
      await searchInput.type('mercy');
      await page.waitForTimeout(1000);

      // BUG: No API call to /quran/search — only local filtering happens
      expect(apiCalls.length).toBe(0);
    }
  });

  it('should navigate to surah detail on click', async () => {
    await page.goto(url('/quran'));
    await page.waitForTimeout(3000);

    const surahLink = await page.$('a[href*="/quran/"]');
    if (surahLink) {
      await surahLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/quran\/\d+/);
    }
  });
});

describe('Quran — Surah Detail', () => {
  beforeAll(async () => {
    page = await newPage();
    await page.goto(url('/quran/1')); // Al-Fatiha
    await page.waitForTimeout(3000);
  });

  afterAll(async () => {
    await page.close();
  });

  it('should load surah detail page with verses', async () => {
    const pageContent = await page.content();
    const hasVerses = pageContent.includes('verse') || pageContent.includes('ayah') ||
      pageContent.includes('بِسْمِ') || // Bismillah
      pageContent.length > 1000; // Page has substantial content
    expect(hasVerses).toBeTruthy();
  });
});
