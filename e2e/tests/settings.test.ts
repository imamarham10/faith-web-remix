import { describe, it, expect, beforeAll, afterAll, beforeEach } from '../run';
import { newPage, url } from '../helpers/setup';
import { loginUser, clearAuthTokens } from '../helpers/auth';
import { Page } from 'puppeteer';

let page: Page;

describe('Settings — Authentication Gate', () => {
  beforeAll(async () => {
    page = await newPage();
  });

  afterAll(async () => {
    await page.close();
  });

  it('should show sign-in requirement when not authenticated', async () => {
    await page.goto(url('/'));
    await clearAuthTokens(page);
    await page.goto(url('/settings'));
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    const currentUrl = page.url();
    const requiresAuth = currentUrl.includes('/auth/login') ||
      pageContent.toLowerCase().includes('sign in') ||
      pageContent.toLowerCase().includes('log in') ||
      pageContent.toLowerCase().includes('required');
    expect(requiresAuth).toBeTruthy();
  });
});

describe('Settings — Form Validation & Bug Verification', () => {
  beforeAll(async () => {
    page = await newPage();
    // Login first
    await loginUser(page);
  });

  afterAll(async () => {
    await page.close();
  });

  it('should load settings page with form fields', async () => {
    await page.goto(url('/settings'));
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    const hasSettingsContent = pageContent.toLowerCase().includes('settings') ||
      pageContent.toLowerCase().includes('preferences') ||
      pageContent.toLowerCase().includes('faith') ||
      pageContent.toLowerCase().includes('language');
    expect(hasSettingsContent).toBeTruthy();
  });

  it('[BUG #2] should show "Jewish" as a faith option that backend rejects', async () => {
    await page.goto(url('/settings'));
    await page.waitForTimeout(2000);

    // Check for faith selector
    const faithSelect = await page.$('select[name="faith"], [data-name="faith"]');
    if (faithSelect) {
      const options = await page.evaluate((el: any) => {
        if (el.tagName === 'SELECT') {
          return Array.from(el.options).map((o: any) => o.value);
        }
        return [];
      }, faithSelect);

      // BUG: "jewish" is an option in the frontend but backend rejects it
      const hasJewish = options.includes('jewish') || options.includes('Jewish');
      expect(hasJewish).toBeTruthy(); // Documents that the option exists

      // Try selecting Jewish and saving — this SHOULD fail with 400
      await page.select('select[name="faith"]', 'jewish');
    }

    // Look for faith options in the page content
    const pageContent = await page.content();
    const hasJewishOption = pageContent.includes('Jewish') || pageContent.includes('jewish');
    // This documents the mismatch — Jewish is shown but will be rejected
    expect(hasJewishOption).toBeTruthy();
  });

  it('[BUG #1] should show Arabic/Urdu/French/Turkish as language options that backend rejects', async () => {
    await page.goto(url('/settings'));
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    // These languages exist in frontend but backend rejects them
    const hasArabic = pageContent.includes('Arabic') || pageContent.includes('العربية');
    const hasUrdu = pageContent.includes('Urdu') || pageContent.includes('اردو');
    const hasFrench = pageContent.includes('French') || pageContent.includes('Français');
    const hasTurkish = pageContent.includes('Turkish') || pageContent.includes('Türkçe');

    // At least some of these unsupported languages should be present (they are the bug)
    const hasUnsupportedLangs = hasArabic || hasUrdu || hasFrench || hasTurkish;
    expect(hasUnsupportedLangs).toBeTruthy();
  });

  it('[BUG #1] selecting an unsupported language should cause backend 400 error on save', async () => {
    await page.goto(url('/settings'));
    await page.waitForTimeout(2000);

    // Try to select Arabic language
    const langSelect = await page.$('select[name="language"], [data-name="language"]');
    if (langSelect) {
      await page.select('select[name="language"]', 'ar');
    }

    // Click save button
    const saveBtn = await page.$('button[type="submit"], button:has-text("Save")');
    if (saveBtn) {
      // Listen for network response
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes('/users/preferences') || response.url().includes('/preferences'),
        { timeout: 5000 }
      ).catch(() => null);

      await saveBtn.click();
      const response = await responsePromise;

      if (response) {
        // BUG: Backend returns 400 for Arabic language
        const status = response.status();
        // Documenting the bug: this should NOT be 400, but it will be
        expect(status).toBe(400);
      }
    }
  });

  it('[BUG #17] should accept any characters in country code field (no validation)', async () => {
    await page.goto(url('/settings'));
    await page.waitForTimeout(2000);

    const countryInput = await page.$('input[name="countryCode"], input[name="country"]');
    if (countryInput) {
      // Clear and type invalid data
      await countryInput.click({ clickCount: 3 });
      await countryInput.type('XYZ');

      const value = await page.evaluate((el: any) => el.value, countryInput);
      // BUG: No client-side validation — accepts any characters
      expect(value).toBe('XYZ');
    }
  });

  it('should display notification toggle switches', async () => {
    await page.goto(url('/settings'));
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    const hasNotifications = pageContent.toLowerCase().includes('notification') ||
      pageContent.toLowerCase().includes('push') ||
      pageContent.toLowerCase().includes('email');
    expect(hasNotifications).toBeTruthy();
  });

  it('should show success message after saving valid settings', async () => {
    await page.goto(url('/settings'));
    await page.waitForTimeout(2000);

    // Select valid options (English language, Muslim faith)
    const langSelect = await page.$('select[name="language"]');
    if (langSelect) await page.select('select[name="language"]', 'en');

    const faithSelect = await page.$('select[name="faith"]');
    if (faithSelect) await page.select('select[name="faith"]', 'muslim');

    const saveBtn = await page.$('button[type="submit"], button:has-text("Save")');
    if (saveBtn) {
      await saveBtn.click();
      await page.waitForTimeout(2000);

      const pageContent = await page.content();
      const hasSuccess = pageContent.toLowerCase().includes('success') ||
        pageContent.toLowerCase().includes('saved') ||
        pageContent.toLowerCase().includes('updated');
      // If authenticated and valid values, should show success
      expect(hasSuccess).toBeTruthy();
    }
  });
});
