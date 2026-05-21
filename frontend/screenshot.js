const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://100.73.184.77:3000');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/rms_page.png', fullPage: true });
  await browser.close();
  console.log('Screenshot saved: /tmp/rms_page.png');
})();
