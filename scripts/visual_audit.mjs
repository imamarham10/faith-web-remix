import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const BASE = 'http://localhost:5173';
const SCREENSHOT_DIR = '/Users/imamarham10/Desktop/Arham/Faith/faith-web-remix/screenshots';

const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'quran', path: '/quran' },
  { name: 'prayers', path: '/prayers' },
  { name: 'dhikr', path: '/dhikr' },
  { name: 'about', path: '/about' },
  { name: 'contact', path: '/contact' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

async function audit() {
  if (!existsSync(SCREENSHOT_DIR)) {
    await mkdir(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  const results = {};

  for (const page of PAGES) {
    results[page.name] = {};

    for (const vp of VIEWPORTS) {
      const tab = await browser.newPage();
      await tab.setViewport({ width: vp.width, height: vp.height });

      try {
        await tab.goto(`${BASE}${page.path}`, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000)); // let animations finish

        // Above-the-fold screenshot
        const foldPath = `${SCREENSHOT_DIR}/${page.name}_${vp.name}_fold.png`;
        await tab.screenshot({ path: foldPath, fullPage: false });

        // Full page screenshot
        const fullPath = `${SCREENSHOT_DIR}/${page.name}_${vp.name}_full.png`;
        await tab.screenshot({ path: fullPath, fullPage: true });

        // Gather metrics
        const metrics = await tab.evaluate((vpWidth, vpHeight) => {
          const data = {};

          // Check viewport meta
          const vpMeta = document.querySelector('meta[name="viewport"]');
          data.viewportMeta = vpMeta ? vpMeta.getAttribute('content') : 'MISSING';

          // Check H1 visibility above fold
          const h1 = document.querySelector('h1');
          if (h1) {
            const rect = h1.getBoundingClientRect();
            data.h1Text = h1.textContent.trim().substring(0, 80);
            data.h1AboveFold = rect.top < vpHeight && rect.bottom > 0;
            data.h1Top = Math.round(rect.top);
          } else {
            data.h1Text = 'NONE';
            data.h1AboveFold = false;
          }

          // Check main CTA visibility (first link/button with btn-primary class)
          const cta = document.querySelector('.btn-primary, a[class*="btn-primary"]');
          if (cta) {
            const rect = cta.getBoundingClientRect();
            data.ctaText = cta.textContent.trim().substring(0, 50);
            data.ctaAboveFold = rect.top < vpHeight && rect.bottom > 0;
            data.ctaTop = Math.round(rect.top);
          } else {
            data.ctaText = 'NONE';
            data.ctaAboveFold = false;
          }

          // Check horizontal overflow
          data.bodyScrollWidth = document.body.scrollWidth;
          data.windowInnerWidth = window.innerWidth;
          data.hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;

          // Check base font size
          const bodyStyle = window.getComputedStyle(document.body);
          data.baseFontSize = bodyStyle.fontSize;

          // Check touch target sizes (all interactive elements)
          const interactiveEls = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
          let smallTargets = 0;
          let totalTargets = 0;
          const smallTargetSamples = [];
          interactiveEls.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              totalTargets++;
              if (rect.width < 44 || rect.height < 44) {
                smallTargets++;
                if (smallTargetSamples.length < 5) {
                  smallTargetSamples.push({
                    tag: el.tagName,
                    text: (el.textContent || '').trim().substring(0, 30),
                    w: Math.round(rect.width),
                    h: Math.round(rect.height),
                  });
                }
              }
            }
          });
          data.totalInteractive = totalTargets;
          data.smallTouchTargets = smallTargets;
          data.smallTargetSamples = smallTargetSamples;

          // Check for overlapping visible elements (basic check)
          // Check text contrast on key elements
          const textEls = document.querySelectorAll('h1, h2, h3, p, a, span, li');
          let lowContrastCount = 0;
          const lowContrastSamples = [];
          textEls.forEach(el => {
            const style = window.getComputedStyle(el);
            const color = style.color;
            const bg = style.backgroundColor;
            // Simple check: if text color matches background, that's a problem
            if (color === bg && color !== 'rgba(0, 0, 0, 0)' && bg !== 'rgba(0, 0, 0, 0)') {
              lowContrastCount++;
            }
          });
          data.lowContrastCount = lowContrastCount;

          // Check images that might not scale
          const images = document.querySelectorAll('img');
          let oversizedImages = 0;
          images.forEach(img => {
            if (img.naturalWidth > vpWidth * 1.5) {
              oversizedImages++;
            }
          });
          data.oversizedImages = oversizedImages;

          // Check hamburger menu presence on mobile
          const hamburger = document.querySelector('[aria-label="Toggle menu"], button.lg\\:hidden');
          data.hasHamburgerMenu = !!hamburger;

          // Navigation check
          const nav = document.querySelector('nav');
          data.hasNav = !!nav;
          if (nav) {
            const navRect = nav.getBoundingClientRect();
            data.navVisible = navRect.height > 0 && navRect.width > 0;
          }

          return data;
        }, vp.width, vp.height);

        results[page.name][vp.name] = metrics;
        console.log(`  Captured: ${page.name} @ ${vp.name} (${vp.width}x${vp.height})`);
      } catch (err) {
        console.error(`  ERROR: ${page.name} @ ${vp.name}: ${err.message}`);
        results[page.name][vp.name] = { error: err.message };
      }

      await tab.close();
    }
  }

  await browser.close();

  // Output results as JSON
  console.log('\n\n=== AUDIT RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
}

audit().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
