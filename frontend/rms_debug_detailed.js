const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  page.on('response', async response => {
    if (response.status() >= 400) {
      console.log(`[HTTP ${response.status()}] ${response.url()}`);
      try {
        const body = await response.text();
        console.log(`  Body: ${body.substring(0, 200)}`);
      } catch(e) {}
    }
  });

  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText || 'unknown'}`);
  });

  console.log('Opening home page...');
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Get all links with group href
  const links = await page.locator('a[href*="/product-groups/"]').all();
  console.log(`Found ${links.length} group links`);
  
  if (links.length > 0) {
    const href = await links[0].getAttribute('href');
    console.log(`Clicking: ${href}`);
    await links[0].click();
    await page.waitForTimeout(3000);
    
    // Get current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Check for error text
    const errorText = await page.locator('body').textContent();
    if (errorText.includes('Failed to fetch')) {
      console.log('ERROR FOUND: Failed to fetch');
    }
    if (errorText.includes('Error')) {
      const match = errorText.match(/Error[^\n]{0,100}/);
      if (match) console.log(`Error text: "${match[0]}"`);
    }
  }

  console.log('Done');
  await browser.close();
})();
