import { Page } from 'puppeteer';
import { url } from './setup';

const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'testuser@example.com',
  password: process.env.E2E_TEST_PASSWORD || 'Test@1234',
  firstName: 'Test',
  lastName: 'User',
  phone: '1234567890',
};

export async function registerUser(page: Page, overrides: Partial<typeof TEST_USER> = {}): Promise<void> {
  const user = { ...TEST_USER, ...overrides };
  await page.goto(url('/auth/register'));
  await page.waitForSelector('form');

  await page.type('input[name="firstName"]', user.firstName);
  await page.type('input[name="lastName"]', user.lastName);
  await page.type('input[name="email"]', user.email);
  await page.type('input[name="phone"]', user.phone);
  await page.type('input[name="password"]', user.password);
  await page.type('input[name="confirmPassword"]', user.password);

  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
}

export async function loginUser(page: Page, email?: string, password?: string): Promise<void> {
  await page.goto(url('/auth/login'));
  await page.waitForSelector('form');

  await page.type('input[name="email"]', email || TEST_USER.email);
  await page.type('input[name="password"]', password || TEST_USER.password);

  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
}

export async function logout(page: Page): Promise<void> {
  // Click the user menu / avatar
  const userMenu = await page.$('[data-testid="user-menu"], .user-menu, button:has(svg)');
  if (userMenu) {
    await userMenu.click();
    await page.waitForTimeout(500);
    // Look for sign out / logout button
    const logoutBtn = await page.$('button:has-text("Sign Out"), button:has-text("Logout"), a[href*="logout"]');
    if (logoutBtn) {
      await logoutBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
    }
  }
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  return !!token;
}

export async function setAuthTokens(page: Page, accessToken: string, refreshToken: string): Promise<void> {
  await page.evaluate((at, rt) => {
    localStorage.setItem('accessToken', at);
    localStorage.setItem('refreshToken', rt);
  }, accessToken, refreshToken);
}

export async function clearAuthTokens(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  });
}

export { TEST_USER };
