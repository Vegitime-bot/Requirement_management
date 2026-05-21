const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = '/Users/vegitime/.openclaw/workspace/rms_test_screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

let logs = [];
function log(msg) {
  logs.push(msg);
  console.log(msg);
}

async function screenshot(page, name) {
  const file = path.join(SCREENSHOT_DIR, `${Date.now()}_${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  log(`  📸 Screenshot: ${name}`);
  return file;
}

async function clickAndScreenshot(page, selector, name, waitMs = 2000) {
  try {
    const el = page.locator(selector).first();
    await el.waitFor({ timeout: 5000 });
    await el.click();
    log(`  ✅ Clicked: ${name}`);
    await page.waitForTimeout(waitMs);
    return await screenshot(page, name);
  } catch (e) {
    log(`  ❌ Failed to click ${name}: ${e.message}`);
    return null;
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Capture all console and network errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => errors.push(`[PAGE ERROR] ${err.message}`));
  page.on('requestfailed', req => errors.push(`[REQUEST FAILED] ${req.url()}: ${req.failure()?.errorText || 'unknown'}`));
  page.on('response', async res => {
    if (res.status() >= 400) {
      const url = res.url();
      if (url.includes('8020') || url.includes('3000')) {
        errors.push(`[HTTP ${res.status()}] ${url}`);
      }
    }
  });

  // ==========================
  // TEST 1: HOME PAGE
  // ==========================
  log('\n=== TEST 1: HOME PAGE ===');
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshot(page, '01_home_page');

  // Check page text for error
  const homeText = await page.locator('body').textContent();
  if (homeText.includes('Failed to fetch') || homeText.includes('Error') && homeText.includes('Connecting to API')) {
    log('  ⚠️ Home page shows error');
  } else {
    log('  ✅ Home page loaded without error');
  }

  // Get all group links
  const groupLinks = await page.locator('a[href*="/product-groups/"]').all();
  log(`  Found ${groupLinks.length} group cards`);

  if (groupLinks.length === 0) {
    log('  ❌ No groups found - stopping test');
    await browser.close();
    fs.writeFileSync('/Users/vegitime/.openclaw/workspace/rms_ui_test_result.txt', logs.join('\n'), 'utf8');
    return;
  }

  // ==========================
  // TEST 2: CLICK FIRST GROUP
  // ==========================
  log('\n=== TEST 2: CLICK FIRST GROUP ===');
  const firstGroupHref = await groupLinks[0].getAttribute('href');
  log(`  Group href: ${firstGroupHref}`);

  await groupLinks[0].click();
  await page.waitForTimeout(3000);
  const currentUrl = page.url();
  log(`  Navigated to: ${currentUrl}`);
  await screenshot(page, '02_group_detail');

  const groupText = await page.locator('body').textContent();
  if (groupText.includes('Failed to fetch group')) {
    log('  ❌ GROUP DETAIL SHOWS: Failed to fetch group');
    // Print all errors collected
    if (errors.length > 0) {
      log('  Errors captured:');
      errors.forEach(e => log(`    ${e}`));
    }
  } else if (groupText.includes('Group not found')) {
    log('  ❌ GROUP DETAIL SHOWS: Group not found');
  } else {
    log('  ✅ Group detail page loaded successfully');
  }

  // ==========================
  // TEST 3: CLICK "NEW PRODUCT" BUTTON (if available)
  // ==========================
  log('\n=== TEST 3: NEW PRODUCT BUTTON ===');
  const newProductBtn = page.locator('text=/New Product|Create Product|New/i, button').filter({ hasText: /New Product|Create Product/ }).first();
  try {
    await newProductBtn.waitFor({ timeout: 3000 });
    await newProductBtn.click();
    log('  ✅ Clicked New Product button');
    await page.waitForTimeout(2000);
    await screenshot(page, '03_new_product_dialog');

    // Try to fill form
    const nameInput = page.locator('input#name, input[placeholder*="name" i]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('TestProduct_' + Date.now());
      log('  ✅ Filled product name');

      const createBtn = page.locator('button:has-text("Create"), button[type="submit"]').first();
      if (await createBtn.isVisible().catch(() => false)) {
        // Clear errors before clicking create
        errors.length = 0;
        await createBtn.click();
        log('  ✅ Clicked Create button');
        await page.waitForTimeout(3000);
        await screenshot(page, '04_after_create_product');

        const afterText = await page.locator('body').textContent();
        if (afterText.includes('Failed to fetch') || afterText.includes('Error')) {
          log('  ❌ PRODUCT CREATION SHOWS ERROR');
          errors.forEach(e => log(`    ${e}`));
        } else {
          log('  ✅ Product created successfully');
        }
      }
    }
  } catch (e) {
    log(`  ⚠️ New Product button not found or not clickable: ${e.message}`);
  }

  // ==========================
  // TEST 4: NAVIGATE BACK AND TEST OTHER PAGES
  // ==========================
  log('\n=== TEST 4: OTHER NAVIGATION ===');

  // Navigate to requirements page
  await page.goto('http://127.0.0.1:3000/requirements');
  await page.waitForTimeout(2000);
  const reqText = await page.locator('body').textContent();
  if (reqText.includes('Failed to fetch') || reqText.includes('Error')) {
    log('  ❌ Requirements page shows error');
  } else {
    log('  ✅ Requirements page loaded');
  }
  await screenshot(page, '05_requirements_page');

  // Navigate to ingest page
  await page.goto('http://127.0.0.1:3000/ingest');
  await page.waitForTimeout(2000);
  const ingestText = await page.locator('body').textContent();
  if (ingestText.includes('Failed to fetch') || ingestText.includes('Error')) {
    log('  ❌ Ingest page shows error');
  } else {
    log('  ✅ Ingest page loaded');
  }
  await screenshot(page, '06_ingest_page');

  // ==========================
  // SUMMARY
  // ==========================
  log('\n=== TEST SUMMARY ===');
  const errorCount = errors.length;
  log(`Total errors captured: ${errorCount}`);
  if (errorCount > 0) {
    log('All errors:');
    errors.forEach(e => log(`  ${e}`));
  }

  await browser.close();

  const report = logs.join('\n');
  fs.writeFileSync('/Users/vegitime/.openclaw/workspace/rms_ui_test_result.txt', report, 'utf8');
  log('\nReport saved to: rms_ui_test_result.txt');
})();
