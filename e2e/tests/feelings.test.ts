import { describe, it, expect, beforeAll, afterAll } from '../run';
import { newPage, url } from '../helpers/setup';
import { Page } from 'puppeteer';

let page: Page;

describe('Feelings — Emotion Grid', () => {
  beforeAll(async () => {
    page = await newPage();
    await page.goto(url('/feelings'));
    await page.waitForTimeout(3000);
  });

  afterAll(async () => {
    await page.close();
  });

  it('should load the feelings page', async () => {
    const pageContent = await page.content();
    const hasFeelingsContent = pageContent.toLowerCase().includes('feeling') ||
      pageContent.toLowerCase().includes('emotion') ||
      pageContent.toLowerCase().includes('how are you') ||
      pageContent.toLowerCase().includes('mood');
    expect(hasFeelingsContent).toBeTruthy();
  });

  it('should display emotion options/cards', async () => {
    const emotionCards = await page.$$('[data-emotion], .emotion-card, .feeling-card, button, .card');
    expect(emotionCards.length).toBeGreaterThan(2);
  });

  it('should navigate to emotion detail page on click', async () => {
    const emotionLink = await page.$('a[href*="/feelings/"]');
    if (emotionLink) {
      await emotionLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/feelings\/.+/);
    }
  });

  it('should show Islamic remedies on emotion detail page', async () => {
    await page.goto(url('/feelings'));
    await page.waitForTimeout(2000);

    const emotionLink = await page.$('a[href*="/feelings/"]');
    if (emotionLink) {
      await emotionLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const pageContent = await page.content();
      const hasRemedies = pageContent.toLowerCase().includes('verse') ||
        pageContent.toLowerCase().includes('hadith') ||
        pageContent.toLowerCase().includes('remedy') ||
        pageContent.toLowerCase().includes('quran') ||
        pageContent.toLowerCase().includes('dua');
      expect(hasRemedies).toBeTruthy();
    }
  });
});
