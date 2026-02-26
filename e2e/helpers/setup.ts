import puppeteer, { Browser, Page } from 'puppeteer';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const API_BASE_URL = process.env.E2E_API_URL || 'http://localhost:3000';
const HEADLESS = process.env.E2E_HEADLESS !== 'false';
const SLOW_MO = parseInt(process.env.E2E_SLOW_MO || '0', 10);

let browser: Browser;

export async function launchBrowser(): Promise<Browser> {
  browser = await puppeteer.launch({
    headless: HEADLESS,
    slowMo: SLOW_MO,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
  }
}

export async function newPage(): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  return page;
}

export function url(path: string): string {
  return `${BASE_URL}${path}`;
}

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export { BASE_URL, API_BASE_URL, browser };
