const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Capture console logs and network errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[CONSOLE ERROR] ${msg.text()}`);
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`[PAGE ERROR] ${err.message}`);
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      const url = response.url();
      if (url.includes('127.0.0.1') || url.includes('localhost')) {
        console.log(`[HTTP ${response.status()}] ${url}`);
        errors.push(`[HTTP ${response.status()}] ${url}`);
      }
    }
  });

  // Open home page
  console.log('Opening http://127.0.0.1:3000...');
  await page.goto('http://127.0.0.1:3000');
  await page.waitForTimeout(3000);

  // Take screenshot of home
  await page.screenshot({ path: '/Users/vegitime/.openclaw/workspace/rms_debug_home.png', fullPage: true });
  console.log('Screenshot saved: rms_debug_home.png');

  // Find and click first group card
  console.log('Looking for group card...');
  const groupLink = await page.locator('a[href*="/product-groups/"]').first();
  if (groupLink) {
    const href = await groupLink.getAttribute('href');
    console.log(`Found group link: ${href}`);
    
    // Clear errors before clicking
    errors.length = 0;
    
    await groupLink.click();
    console.log('Clicked group card');
    await page.waitForTimeout(4000);

    // Take screenshot after click
    await page.screenshot({ path: '/Users/vegitime/.openclaw/workspace/rms_debug_group.png', fullPage: true });
    console.log('Screenshot saved: rms_debug_group.png');

    // Check if error message is shown
    const errorText = await page.locator('text=/Failed to fetch|Error|error/i').first();
    if (errorText) {
      const text = await errorText.textContent();
      console.log(`ERROR TEXT FOUND: "${text}"`);
    }
  } else {
    console.log('No group link found');
    // Try to find any clickable element
    const content = await page.content();
    console.log('Page content length:', content.length);
  }

  // Print all errors
  console.log('\n=== ALL ERRORS ===');
  if (errors.length === 0) {
    console.log('No errors captured');
  } else {
    errors.forEach(e => console.log(e));
  }

  await browser.close();
})();
