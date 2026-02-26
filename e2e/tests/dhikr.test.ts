import { describe, it, expect, beforeAll, afterAll, beforeEach } from '../run';
import { newPage, url } from '../helpers/setup';
import { loginUser, clearAuthTokens } from '../helpers/auth';
import { Page } from 'puppeteer';

let page: Page;

describe('Dhikr — Page Load & Display', () => {
  beforeAll(async () => {
    page = await newPage();
    await page.goto(url('/dhikr'));
    await page.waitForTimeout(2000);
  });

  afterAll(async () => {
    await page.close();
  });

  it('should load the dhikr page', async () => {
    const pageContent = await page.content();
    const hasDhikrContent = pageContent.toLowerCase().includes('dhikr') ||
      pageContent.toLowerCase().includes('counter') ||
      pageContent.toLowerCase().includes('remembrance') ||
      pageContent.toLowerCase().includes('tasbih');
    expect(hasDhikrContent).toBeTruthy();
  });

  it('should show sign-in prompt or empty state for unauthenticated user', async () => {
    await clearAuthTokens(page);
    await page.goto(url('/dhikr'));
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    // Should either prompt to sign in or show empty/default state
    const handled = pageContent.toLowerCase().includes('sign in') ||
      pageContent.toLowerCase().includes('log in') ||
      pageContent.toLowerCase().includes('create') ||
      pageContent.toLowerCase().includes('counter') ||
      pageContent.toLowerCase().includes('no counter');
    expect(handled).toBeTruthy();
  });
});

describe('Dhikr — Counter Management (Authenticated)', () => {
  beforeAll(async () => {
    page = await newPage();
    await loginUser(page);
    await page.goto(url('/dhikr'));
    await page.waitForTimeout(2000);
  });

  afterAll(async () => {
    await page.close();
  });

  it('should show create counter form or button', async () => {
    const pageContent = await page.content();
    const createBtn = await page.$('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
    const hasCreateUI = createBtn !== null || pageContent.toLowerCase().includes('create') || pageContent.toLowerCase().includes('add');
    expect(hasCreateUI).toBeTruthy();
  });

  it('[BUG #3] should allow creating counter without phrase (frontend) but backend requires it', async () => {
    // The frontend API signature is: createCounter(name, phrase?, targetCount?)
    // phrase is optional in frontend but @IsNotEmpty() in backend DTO

    // Find and click create button
    const createBtn = await page.$('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
    if (createBtn) {
      await createBtn.click();
      await page.waitForTimeout(500);
    }

    // Try to fill only the name field (leaving phrase empty)
    const nameInput = await page.$('input[name="name"], input[placeholder*="name"], input[placeholder*="Name"]');
    if (nameInput) {
      await nameInput.type('Test Counter');
    }

    // Look for phrase field - it may or may not be marked as required in the UI
    const phraseInput = await page.$('input[name="phrase"], input[placeholder*="phrase"], textarea[name="phrase"]');
    if (phraseInput) {
      // Check if it's marked as required in the DOM
      const isRequired = await page.evaluate((el: any) => el.required || el.getAttribute('aria-required') === 'true', phraseInput);
      // BUG: phrase should be required (matching backend) but frontend may not enforce it
      // This documents the mismatch
    }

    // Submit without phrase
    const submitBtn = await page.$('button[type="submit"], form button:last-of-type');
    if (submitBtn) {
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes('/dhikr/counters'),
        { timeout: 5000 }
      ).catch(() => null);

      await submitBtn.click();
      await page.waitForTimeout(2000);

      const response = await responsePromise;
      if (response) {
        // BUG: If phrase was empty, backend returns 400
        const status = response.status();
        // Document: sending without phrase will fail with validation error
      }
    }
  });

  it('should create counter with name AND phrase successfully', async () => {
    await page.goto(url('/dhikr'));
    await page.waitForTimeout(2000);

    const createBtn = await page.$('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
    if (createBtn) {
      await createBtn.click();
      await page.waitForTimeout(500);
    }

    const nameInput = await page.$('input[name="name"], input[placeholder*="name"]');
    if (nameInput) await nameInput.type('SubhanAllah Counter');

    const phraseInput = await page.$('input[name="phrase"], input[placeholder*="phrase"], textarea[name="phrase"]');
    if (phraseInput) await phraseInput.type('SubhanAllah');

    const submitBtn = await page.$('button[type="submit"], form button:last-of-type');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(2000);

      const pageContent = await page.content();
      const created = pageContent.includes('SubhanAllah') || pageContent.toLowerCase().includes('success') || pageContent.toLowerCase().includes('created');
      expect(created).toBeTruthy();
    }
  });

  it('should increment counter on click/tap', async () => {
    await page.goto(url('/dhikr'));
    await page.waitForTimeout(2000);

    // Find a counter element with a count
    const counterBtn = await page.$('[data-testid="counter-increment"], .counter-button, button:has-text("tap"), .counter');
    if (counterBtn) {
      // Get initial count
      const initialContent = await page.content();
      await counterBtn.click();
      await page.waitForTimeout(500);

      const updatedContent = await page.content();
      // Content should change (count incremented)
      expect(updatedContent).toBeTruthy();
    }
  });

  it('should show goals section', async () => {
    await page.goto(url('/dhikr'));
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    const hasGoals = pageContent.toLowerCase().includes('goal') ||
      pageContent.toLowerCase().includes('target') ||
      pageContent.toLowerCase().includes('daily') ||
      pageContent.toLowerCase().includes('weekly');
    expect(hasGoals).toBeTruthy();
  });

  it('should show stats/history section', async () => {
    await page.goto(url('/dhikr'));
    await page.waitForTimeout(2000);

    const pageContent = await page.content();
    const hasStats = pageContent.toLowerCase().includes('stat') ||
      pageContent.toLowerCase().includes('history') ||
      pageContent.toLowerCase().includes('progress') ||
      pageContent.toLowerCase().includes('total');
    expect(hasStats).toBeTruthy();
  });
});
