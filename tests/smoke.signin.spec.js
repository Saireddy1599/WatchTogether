// Playwright smoke sign-in test (template)
// Requires environment variables: FIREBASE_EMAIL, FIREBASE_PASSWORD (or use Google OAuth flow manual)

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('https://watchtogether-48c1e.web.app', { waitUntil: 'load' });
    // Click Google sign-in (manual OAuth popup will not work headless without credentials)
    // This is a placeholder to be extended with service-account-based test or API-based token exchange.
    console.log('Loaded page title:', await page.title());
  } catch (e) {
    console.error('Smoke test failed', e);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
