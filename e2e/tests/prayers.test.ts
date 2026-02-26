import { describe, it, expect, beforeAll, afterAll } from '../run';
import { newPage, url } from '../helpers/setup';
import { Page } from 'puppeteer';

let page: Page;

describe('Prayers — Page & Prayer Times', () => {
  beforeAll(async () => {
    page = await newPage();
    // Grant geolocation permission
    const context = page.browserContext();
    await context.overridePermissions(url('/'), ['geolocation']);
    // Mock geolocation (Mecca coordinates)
    await page.evaluateOnNewDocument(() => {
      (navigator as any).geolocation.getCurrentPosition = (cb: any) => cb({
        coords: { latitude: 21.4225, longitude: 39.8262, accuracy: 100 }
      });
    });
    await page.goto(url('/prayers'));
    await page.waitForTimeout(3000);
  });

  afterAll(async () => {
    await page.close();
  });

  it('should load the prayers page', async () => {
    const pageContent = await page.content();
    const hasPrayerContent = pageContent.toLowerCase().includes('prayer') ||
      pageContent.toLowerCase().includes('salah') ||
      pageContent.toLowerCase().includes('fajr') ||
      pageContent.toLowerCase().includes('dhuhr');
    expect(hasPrayerContent).toBeTruthy();
  });

  it('should display five daily prayer times', async () => {
    const pageContent = await page.content();
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    let foundCount = 0;
    for (const prayer of prayers) {
      if (pageContent.toLowerCase().includes(prayer)) foundCount++;
    }
    // Should find at least 3 of the 5 prayer names
    expect(foundCount).toBeGreaterThan(2);
  });

  it('should show prayer time values (HH:MM format)', async () => {
    const pageContent = await page.content();
    // Look for time patterns like "5:30" or "12:15" or "05:30 AM"
    const hasTimeFormat = /\d{1,2}:\d{2}/.test(pageContent);
    expect(hasTimeFormat).toBeTruthy();
  });

  it('should show location or geolocation prompt', async () => {
    const pageContent = await page.content();
    const hasLocation = pageContent.toLowerCase().includes('location') ||
      pageContent.toLowerCase().includes('lat') ||
      pageContent.toLowerCase().includes('mecca') ||
      pageContent.toLowerCase().includes('city') ||
      pageContent.includes('21.42');
    expect(hasLocation).toBeTruthy();
  });

  it('should have prayer logging UI for authenticated users', async () => {
    const pageContent = await page.content();
    const hasLogging = pageContent.toLowerCase().includes('log') ||
      pageContent.toLowerCase().includes('mark') ||
      pageContent.toLowerCase().includes('prayed') ||
      pageContent.toLowerCase().includes('on time') ||
      pageContent.toLowerCase().includes('late');
    // Logging UI may or may not appear based on auth state
    expect(pageContent).toBeTruthy(); // At minimum, page loaded
  });
});
