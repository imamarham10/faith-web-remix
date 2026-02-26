import { describe, it, expect, beforeAll, afterAll } from '../run';
import { newPage, url } from '../helpers/setup';
import { Page } from 'puppeteer';

let page: Page;

describe('Navigation — Header Links', () => {
  beforeAll(async () => {
    page = await newPage();
    await page.goto(url('/'));
    await page.waitForSelector('header, nav');
  });

  afterAll(async () => {
    await page.close();
  });

  it('should have header with navigation links', async () => {
    const header = await page.$('header');
    expect(header).not.toBeNull();
  });

  it('should navigate to Home page via logo or Home link', async () => {
    await page.goto(url('/prayers')); // go somewhere else first
    const homeLink = await page.$('a[href="/"], header a:first-child');
    if (homeLink) {
      await homeLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
    }
    const currentUrl = page.url();
    expect(currentUrl).toBe(url('/'));
  });

  it('should navigate to Prayers page', async () => {
    await page.goto(url('/'));
    const link = await page.$('a[href="/prayers"]');
    expect(link).not.toBeNull();
    if (link) {
      await link.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
      expect(page.url()).toContain('/prayers');
    }
  });

  it('should navigate to Quran page', async () => {
    const link = await page.$('a[href="/quran"]');
    expect(link).not.toBeNull();
    if (link) {
      await link.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
      expect(page.url()).toContain('/quran');
    }
  });

  it('should navigate to Duas page', async () => {
    const link = await page.$('a[href="/duas"]');
    expect(link).not.toBeNull();
    if (link) {
      await link.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
      expect(page.url()).toContain('/duas');
    }
  });

  it('should navigate to Dhikr page', async () => {
    const link = await page.$('a[href="/dhikr"]');
    expect(link).not.toBeNull();
    if (link) {
      await link.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
      expect(page.url()).toContain('/dhikr');
    }
  });

  it('should navigate to Calendar page', async () => {
    const link = await page.$('a[href="/calendar"]');
    expect(link).not.toBeNull();
    if (link) {
      await link.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
      expect(page.url()).toContain('/calendar');
    }
  });

  it('should navigate to Qibla page', async () => {
    const link = await page.$('a[href="/qibla"]');
    expect(link).not.toBeNull();
    if (link) {
      await link.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
      expect(page.url()).toContain('/qibla');
    }
  });

  it('should navigate to Feelings page', async () => {
    const link = await page.$('a[href="/feelings"]');
    expect(link).not.toBeNull();
    if (link) {
      await link.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
      expect(page.url()).toContain('/feelings');
    }
  });

  it('[BUG #11] Names page should be in navigation but is missing', async () => {
    await page.goto(url('/'));
    await page.waitForSelector('header');

    // Check for link to /names in header navigation
    const namesLink = await page.$('header a[href="/names"], nav a[href="/names"]');
    // BUG: This should exist but doesn't — Names page is unreachable from navigation
    expect(namesLink).not.toBeNull();
  });

  it('[BUG #12] Quran bookmarks page should be linked but is orphaned', async () => {
    await page.goto(url('/quran'));
    await page.waitForTimeout(1000);

    // Check for any link to /quran/bookmarks on the Quran page or in header
    const bookmarksLink = await page.$('a[href="/quran/bookmarks"]');
    // BUG: Bookmarks page exists but has no navigation link
    expect(bookmarksLink).not.toBeNull();
  });
});

describe('Navigation — Mobile Menu', () => {
  beforeAll(async () => {
    page = await newPage();
    // Set mobile viewport
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(url('/'));
    await page.waitForTimeout(1000);
  });

  afterAll(async () => {
    await page.close();
  });

  it('should show mobile menu toggle button', async () => {
    const menuBtn = await page.$('button[aria-label*="menu"], button[aria-label*="Menu"], header button:has(svg)');
    expect(menuBtn).not.toBeNull();
  });

  it('should open mobile menu when toggle is clicked', async () => {
    const menuBtn = await page.$('button[aria-label*="menu"], button[aria-label*="Menu"], header button:has(svg)');
    if (menuBtn) {
      await menuBtn.click();
      await page.waitForTimeout(500);

      // Mobile menu should be visible with nav links
      const mobileNav = await page.$('[role="dialog"], .mobile-menu, nav:not([class*="hidden"])');
      const pageContent = await page.content();
      const hasNavLinks = pageContent.includes('Prayers') && pageContent.includes('Quran');
      expect(hasNavLinks).toBeTruthy();
    }
  });

  it('should navigate via mobile menu links', async () => {
    // Open menu
    const menuBtn = await page.$('button[aria-label*="menu"], button[aria-label*="Menu"], header button:has(svg)');
    if (menuBtn) {
      await menuBtn.click();
      await page.waitForTimeout(500);

      // Click a nav link
      const prayersLink = await page.$('a[href="/prayers"]');
      if (prayersLink) {
        await prayersLink.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
        expect(page.url()).toContain('/prayers');
      }
    }
  });
});

describe('Navigation — Auth-Protected Routes', () => {
  beforeAll(async () => {
    page = await newPage();
    await page.setViewport({ width: 1280, height: 800 });
  });

  afterAll(async () => {
    await page.close();
  });

  it('should show "Sign In Required" or redirect for Settings page when not logged in', async () => {
    // Clear any existing tokens
    await page.goto(url('/'));
    await page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });

    await page.goto(url('/settings'));
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const pageContent = await page.content();

    // Should either redirect to login or show auth requirement message
    const isProtected = currentUrl.includes('/auth/login') ||
      pageContent.toLowerCase().includes('sign in') ||
      pageContent.toLowerCase().includes('log in') ||
      pageContent.toLowerCase().includes('required') ||
      pageContent.toLowerCase().includes('authenticated');

    expect(isProtected).toBeTruthy();
  });

  it('should allow direct navigation to all public routes', async () => {
    const publicRoutes = ['/', '/prayers', '/quran', '/duas', '/dhikr', '/calendar', '/qibla', '/feelings', '/names'];

    for (const route of publicRoutes) {
      await page.goto(url(route), { waitUntil: 'networkidle2', timeout: 10000 });
      const currentUrl = page.url();
      // Should NOT redirect to login
      expect(currentUrl).not.toContain('/auth/login');
    }
  });
});
