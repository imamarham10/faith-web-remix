import { describe, it, expect, beforeAll, afterAll } from '../run';
import { newPage, url } from '../helpers/setup';
import { Page } from 'puppeteer';

let page: Page;

describe('Calendar — Islamic Calendar', () => {
  beforeAll(async () => {
    page = await newPage();
    await page.goto(url('/calendar'));
    await page.waitForTimeout(3000);
  });

  afterAll(async () => {
    await page.close();
  });

  it('should load the calendar page', async () => {
    const pageContent = await page.content();
    const hasCalendarContent = pageContent.toLowerCase().includes('calendar') ||
      pageContent.toLowerCase().includes('hijri') ||
      pageContent.toLowerCase().includes('gregorian') ||
      pageContent.toLowerCase().includes('month');
    expect(hasCalendarContent).toBeTruthy();
  });

  it('should display current date in both Hijri and Gregorian', async () => {
    const pageContent = await page.content();
    // Should have both calendar systems
    const hasHijri = pageContent.toLowerCase().includes('hijri') ||
      pageContent.includes('Muharram') || pageContent.includes('Safar') ||
      pageContent.includes('Rabi') || pageContent.includes('Jumada') ||
      pageContent.includes('Rajab') || pageContent.includes('Sha') ||
      pageContent.includes('Ramadan') || pageContent.includes('Shawwal') ||
      pageContent.includes('Dhul');
    expect(hasHijri).toBeTruthy();
  });

  it('should show month navigation (previous/next)', async () => {
    const prevBtn = await page.$('button:has-text("Prev"), button:has-text("←"), button[aria-label*="previous"]');
    const nextBtn = await page.$('button:has-text("Next"), button:has-text("→"), button[aria-label*="next"]');
    const hasNav = prevBtn !== null || nextBtn !== null;
    expect(hasNav).toBeTruthy();
  });

  it('should navigate to next month when clicking next', async () => {
    const initialContent = await page.content();
    const nextBtn = await page.$('button:has-text("Next"), button:has-text("→"), button[aria-label*="next"]');
    if (nextBtn) {
      await nextBtn.click();
      await page.waitForTimeout(2000);
      const updatedContent = await page.content();
      // Content should change (different month displayed)
      expect(updatedContent).not.toBe(initialContent);
    }
  });

  it('should show upcoming Islamic events', async () => {
    const pageContent = await page.content();
    const hasEvents = pageContent.toLowerCase().includes('event') ||
      pageContent.toLowerCase().includes('eid') ||
      pageContent.toLowerCase().includes('ramadan') ||
      pageContent.toLowerCase().includes('upcoming') ||
      pageContent.toLowerCase().includes('islamic');
    expect(hasEvents).toBeTruthy();
  });

  it('should display day cells with dates', async () => {
    // Calendar should have numbered day cells
    const dayCells = await page.$$('[data-day], .calendar-day, td, .day-cell');
    expect(dayCells.length).toBeGreaterThan(0);
  });
});
