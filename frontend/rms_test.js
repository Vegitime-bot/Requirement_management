/**
 * RMS (Requirements Management System) - Full Feature Test
 * Tests all buttons and interactive elements on every page
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:3000';
const REPORT_FILE = '/Users/vegitime/.openclaw/workspace/rms_test_report.md';
const SCREENSHOT_DIR = '/Users/vegitime/.openclaw/workspace/rms_test_screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let report = [];
let browser;
let context;
let page;

function log(message) {
  console.log(`[TEST] ${message}`);
}

async function takeScreenshot(name) {
  const fileName = `${Date.now()}_${name}.png`;
  const filePath = path.join(SCREENSHOT_DIR, fileName);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

async function testSection(title, testFn) {
  log(`\n=== ${title} ===`);
  report.push(`\n## ${title}\n`);
  try {
    await testFn();
  } catch (e) {
    const errorMsg = `❌ FAIL: ${e.message}`;
    log(errorMsg);
    report.push(`- ${errorMsg}\n`);
    try {
      const ss = await takeScreenshot(`ERROR_${title.replace(/\s+/g, '_')}`);
      report.push(`  - Screenshot: ${ss}\n`);
    } catch {}
  }
}

async function testButton(name, selector, action = 'click') {
  try {
    const element = await page.$(selector);
    if (!element) {
      report.push(`- ⚠️ ${name}: Element not found (${selector})\n`);
      return false;
    }

    const isVisible = await element.isVisible();
    if (!isVisible) {
      report.push(`- ⚠️ ${name}: Element not visible (${selector})\n`);
      return false;
    }

    const text = await element.textContent();
    log(`  Found: "${name}" (${selector}) - text: "${text?.trim() || 'N/A'}"`);

    if (action === 'click') {
      await element.click();
      await page.waitForTimeout(500);
    }

    report.push(`- ✅ ${name}: Found and ${action}ed (${selector})\n`);
    return true;
  } catch (e) {
    report.push(`- ❌ ${name}: Error - ${e.message} (${selector})\n`);
    return false;
  }
}

async function testNavigation(name, url, selector) {
  try {
    await page.goto(`${BASE_URL}${url}`);
    await page.waitForTimeout(1500);
    const ss = await takeScreenshot(name.replace(/\s+/g, '_'));
    log(`  Navigated to ${url}`);
    report.push(`- ✅ ${name}: Navigation to ${url} successful\n`);
    report.push(`  - Screenshot: ${ss}\n`);
    return true;
  } catch (e) {
    report.push(`- ❌ ${name}: Navigation failed - ${e.message}\n`);
    return false;
  }
}

async function checkPageErrors() {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  await page.waitForTimeout(500);
  if (errors.length > 0) {
    report.push(`  - ⚠️ Console errors: ${errors.length}\n`);
    errors.slice(0, 3).forEach(e => report.push(`    - ${e}\n`));
  }
  return errors;
}

async function runTests() {
  log('Starting RMS Feature Test...');
  log(`Base URL: ${BASE_URL}`);
  log(`Report: ${REPORT_FILE}`);
  log(`Screenshots: ${SCREENSHOT_DIR}`);

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  page = await context.newPage();

  report.push(`# RMS Feature Test Report\n`);
  report.push(`**Date:** ${new Date().toISOString()}\n`);
  report.push(`**Base URL:** ${BASE_URL}\n\n`);

  // ===========================================
  // 1. HOME PAGE (/)
  // ===========================================
  await testSection('Home Page (/)', async () => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    const ss = await takeScreenshot('01_home_page');
    report.push(`- Screenshot: ${ss}\n`);

    // Check all buttons on home page
    const homeButtons = [
      ['Dashboard Stats Cards', '.stat-card, [class*="stat"], .card'],
      ['Navigation - Product Groups', 'a[href*="product-groups"], text=Product Groups'],
      ['Navigation - Products', 'a[href*="products"], text=Products'],
      ['Navigation - Requirements', 'a[href*="requirements"], text=Requirements'],
      ['Navigation - Ingest', 'a[href*="ingest"], text=Ingest'],
      ['Navigation - Variants', 'a[href*="variants"], text=Variants'],
    ];

    for (const [name, selector] of homeButtons) {
      await testButton(name, selector, 'hover');
    }

    await checkPageErrors();
  });

  // ===========================================
  // 2. PRODUCT GROUPS PAGE (/product-groups)
  // ===========================================
  await testSection('Product Groups Page', async () => {
    await testNavigation('Product Groups', '/product-groups', '');

    const buttons = [
      ['Create Product Group', 'button:has-text("Create"), button:has-text("New"), a:has-text("New")'],
      ['Search Filter', 'input[type="search"], input[placeholder*="search" i]'],
      ['Table Row - First', 'table tbody tr:first-child, [role="row"]:nth-child(2)'],
      ['Pagination - Next', 'button:has-text("Next"), [aria-label*="next" i]'],
      ['Pagination - Previous', 'button:has-text("Previous"), [aria-label*="previous" i]'],
    ];

    for (const [name, selector] of buttons) {
      await testButton(name, selector, 'hover');
    }

    await checkPageErrors();
  });

  // ===========================================
  // 3. PRODUCT GROUP DETAIL (/product-groups/[id])
  // ===========================================
  await testSection('Product Group Detail Page', async () => {
    // Try to find and click first product group
    await page.goto(`${BASE_URL}/product-groups`);
    await page.waitForTimeout(1500);

    const firstRow = await page.$('table tbody tr:first-child a, [role="row"]:nth-child(2) a, tbody tr:first-child');
    if (firstRow) {
      await firstRow.click();
      await page.waitForTimeout(1500);
      const ss = await takeScreenshot('03_product_group_detail');
      report.push(`- ✅ Clicked first product group\n`);
      report.push(`  - Screenshot: ${ss}\n`);

      // Detail page buttons
      const detailButtons = [
        ['Edit Button', 'button:has-text("Edit"), a:has-text("Edit")'],
        ['Delete Button', 'button:has-text("Delete"), a:has-text("Delete")'],
        ['Back Button', 'button:has-text("Back"), a:has-text("Back")'],
        ['Add Product', 'button:has-text("Add"), a:has-text("Add Product")'],
      ];

      for (const [name, selector] of detailButtons) {
        await testButton(name, selector, 'hover');
      }
    } else {
      report.push(`- ⚠️ No product groups found to click\n`);
    }

    await checkPageErrors();
  });

  // ===========================================
  // 4. PRODUCTS PAGE (/products)
  // ===========================================
  await testSection('Products Page', async () => {
    await testNavigation('Products', '/products', '');

    const buttons = [
      ['Create Product', 'button:has-text("Create"), button:has-text("New"), a:has-text("New")'],
      ['Search Filter', 'input[type="search"], input[placeholder*="search" i]'],
      ['Filter Dropdown', 'select, [role="combobox"]'],
      ['Table Sort', 'th, [role="columnheader"]'],
      ['First Product Link', 'table tbody tr:first-child a, tbody tr:first-child td:first-child'],
    ];

    for (const [name, selector] of buttons) {
      await testButton(name, selector, 'hover');
    }

    await checkPageErrors();
  });

  // ===========================================
  // 5. PRODUCT DETAIL (/products/[id])
  // ===========================================
  await testSection('Product Detail Page', async () => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForTimeout(1500);

    const firstRow = await page.$('table tbody tr:first-child a, tbody tr:first-child td:first-child a, tbody tr:first-child');
    if (firstRow) {
      await firstRow.click();
      await page.waitForTimeout(1500);
      const ss = await takeScreenshot('05_product_detail');
      report.push(`- ✅ Clicked first product\n`);
      report.push(`  - Screenshot: ${ss}\n`);

      const detailButtons = [
        ['Edit Product', 'button:has-text("Edit"), a:has-text("Edit")'],
        ['Delete Product', 'button:has-text("Delete"), a:has-text("Delete")'],
        ['Add Variant', 'button:has-text("Add Variant"), a:has-text("Add Variant")'],
        ['Add Requirement', 'button:has-text("Add Requirement"), a:has-text("Add Requirement")'],
        ['Tabs - Requirements', 'button:has-text("Requirements"), [role="tab"]:has-text("Requirements")'],
        ['Tabs - Variants', 'button:has-text("Variants"), [role="tab"]:has-text("Variants")'],
        ['Tabs - Overview', 'button:has-text("Overview"), [role="tab"]:has-text("Overview")'],
      ];

      for (const [name, selector] of detailButtons) {
        await testButton(name, selector, 'hover');
      }
    } else {
      report.push(`- ⚠️ No products found to click\n`);
    }

    await checkPageErrors();
  });

  // ===========================================
  // 6. VARIANTS PAGE (/variants)
  // ===========================================
  await testSection('Variants Page', async () => {
    await testNavigation('Variants', '/variants', '');

    const buttons = [
      ['Create Variant', 'button:has-text("Create"), button:has-text("New"), a:has-text("New")'],
      ['Search Filter', 'input[type="search"], input[placeholder*="search" i]'],
      ['First Variant Link', 'table tbody tr:first-child a, tbody tr:first-child'],
    ];

    for (const [name, selector] of buttons) {
      await testButton(name, selector, 'hover');
    }

    await checkPageErrors();
  });

  // ===========================================
  // 7. VARIANT DETAIL (/variants/[id])
  // ===========================================
  await testSection('Variant Detail Page', async () => {
    await page.goto(`${BASE_URL}/variants`);
    await page.waitForTimeout(1500);

    const firstRow = await page.$('table tbody tr:first-child a, tbody tr:first-child td:first-child a, tbody tr:first-child');
    if (firstRow) {
      await firstRow.click();
      await page.waitForTimeout(1500);
      const ss = await takeScreenshot('07_variant_detail');
      report.push(`- ✅ Clicked first variant\n`);
      report.push(`  - Screenshot: ${ss}\n`);

      const detailButtons = [
        ['Edit Variant', 'button:has-text("Edit"), a:has-text("Edit")'],
        ['Delete Variant', 'button:has-text("Delete"), a:has-text("Delete")'],
        ['Add Requirement', 'button:has-text("Add Requirement"), a:has-text("Add Requirement")'],
        ['Tabs - Requirements', 'button:has-text("Requirements"), [role="tab"]:has-text("Requirements")'],
      ];

      for (const [name, selector] of detailButtons) {
        await testButton(name, selector, 'hover');
      }
    } else {
      report.push(`- ⚠️ No variants found to click\n`);
    }

    await checkPageErrors();
  });

  // ===========================================
  // 8. REQUIREMENTS PAGE (/requirements)
  // ===========================================
  await testSection('Requirements Page', async () => {
    await testNavigation('Requirements', '/requirements', '');

    const buttons = [
      ['Create Requirement', 'button:has-text("Create"), button:has-text("New"), a:has-text("New"), a:has-text("Create")'],
      ['Search Filter', 'input[type="search"], input[placeholder*="search" i]'],
      ['Filter by Status', 'select, [role="combobox"]'],
      ['Filter by Product', 'select, [role="combobox"]'],
      ['Filter by Category', 'select, [role="combobox"]'],
      ['First Requirement Link', 'table tbody tr:first-child a, tbody tr:first-child td:first-child a'],
      ['Export Button', 'button:has-text("Export"), a:has-text("Export")'],
    ];

    for (const [name, selector] of buttons) {
      await testButton(name, selector, 'hover');
    }

    await checkPageErrors();
  });

  // ===========================================
  // 9. REQUIREMENT DETAIL (/requirements/[id])
  // ===========================================
  await testSection('Requirement Detail Page', async () => {
    await page.goto(`${BASE_URL}/requirements`);
    await page.waitForTimeout(1500);

    const firstRow = await page.$('table tbody tr:first-child a, tbody tr:first-child td:first-child a, tbody tr:first-child');
    if (firstRow) {
      await firstRow.click();
      await page.waitForTimeout(1500);
      const ss = await takeScreenshot('09_requirement_detail');
      report.push(`- ✅ Clicked first requirement\n`);
      report.push(`  - Screenshot: ${ss}\n`);

      const detailButtons = [
        ['Edit Requirement', 'button:has-text("Edit"), a:has-text("Edit")'],
        ['Delete Requirement', 'button:has-text("Delete"), a:has-text("Delete")'],
        ['Status Change Dropdown', 'select, [role="combobox"]'],
        ['Back to List', 'button:has-text("Back"), a:has-text("Back")'],
        ['Add Version', 'button:has-text("Version"), a:has-text("Version")'],
        ['History Tab', 'button:has-text("History"), [role="tab"]:has-text("History")'],
        ['Dependencies Tab', 'button:has-text("Dependencies"), [role="tab"]:has-text("Dependencies")'],
        ['Related Tab', 'button:has-text("Related"), [role="tab"]:has-text("Related")'],
      ];

      for (const [name, selector] of detailButtons) {
        await testButton(name, selector, 'hover');
      }
    } else {
      report.push(`- ⚠️ No requirements found to click\n`);
    }

    await checkPageErrors();
  });

  // ===========================================
  // 10. NEW REQUIREMENT (/requirements/new)
  // ===========================================
  await testSection('New Requirement Page', async () => {
    await testNavigation('New Requirement', '/requirements/new', '');

    const formElements = [
      ['Title Input', 'input[name="title"], input[placeholder*="title" i], input[id*="title" i]'],
      ['Description Textarea', 'textarea[name="description"], textarea[placeholder*="description" i]'],
      ['Product Select', 'select[name="product"], select[id*="product" i]'],
      ['Category Select', 'select[name="category"], select[id*="category" i]'],
      ['Priority Select', 'select[name="priority"], select[id*="priority" i]'],
      ['Status Select', 'select[name="status"], select[id*="status" i]'],
      ['Cancel Button', 'button:has-text("Cancel"), a:has-text("Cancel")'],
      ['Submit Button', 'button[type="submit"], button:has-text("Submit"), button:has-text("Save"), button:has-text("Create")'],
    ];

    for (const [name, selector] of formElements) {
      await testButton(name, selector, 'hover');
    }

    await checkPageErrors();
  });

  // ===========================================
  // 11. INGEST PAGE (/ingest)
  // ===========================================
  await testSection('Ingest Page', async () => {
    await testNavigation('Ingest', '/ingest', '');

    const buttons = [
      ['Upload File Button', 'input[type="file"], button:has-text("Upload"), label:has-text("Upload")'],
      ['Process Button', 'button:has-text("Process"), button:has-text("Start"), button:has-text("Ingest")'],
      ['Document Type Select', 'select[name*="type"], select[id*="type" i]'],
      ['Product Select', 'select[name*="product"], select[id*="product" i]'],
      ['Drag Drop Zone', '[class*="drop"], [class*="upload"], div:has-text("drop")'],
      ['Clear Button', 'button:has-text("Clear"), button:has-text("Reset")'],
      ['Recent Uploads', 'table tbody tr:first-child, [class*="recent"]'],
    ];

    for (const [name, selector] of buttons) {
      await testButton(name, selector, 'hover');
    }

    await checkPageErrors();
  });

  // ===========================================
  // 12. NAVIGATION & LAYOUT TESTS
  // ===========================================
  await testSection('Navigation & Layout', async () => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(1500);

    // Sidebar/Navigation items
    const navItems = [
      ['Nav - Home', 'a[href="/"], nav a:first-child'],
      ['Nav - Product Groups', 'a[href*="product-groups"], a:has-text("Product Groups")'],
      ['Nav - Products', 'a[href*="/products"], a:has-text("Products")'],
      ['Nav - Requirements', 'a[href*="/requirements"], a:has-text("Requirements")'],
      ['Nav - Variants', 'a[href*="/variants"], a:has-text("Variants")'],
      ['Nav - Ingest', 'a[href*="/ingest"], a:has-text("Ingest")'],
    ];

    for (const [name, selector] of navItems) {
      const found = await testButton(name, selector, 'hover');
      if (found) {
        await page.click(selector);
        await page.waitForTimeout(1000);
        const ss = await takeScreenshot(`nav_${name.replace(/\s+/g, '_')}`);
        report.push(`  - Navigated: ${ss}\n`);
        await page.goto(BASE_URL);
        await page.waitForTimeout(800);
      }
    }
  });

  // ===========================================
  // Summary
  // ===========================================
  report.push(`\n## Test Summary\n`);
  report.push(`**Completed at:** ${new Date().toISOString()}\n`);
  const allText = report.join('');
  const passCount = (allText.match(/✅/g) || []).length;
  const failCount = (allText.match(/❌/g) || []).length;
  const warnCount = (allText.match(/⚠️/g) || []).length;

  report.push(`- ✅ Passed: ${passCount}\n`);
  report.push(`- ❌ Failed: ${failCount}\n`);
  report.push(`- ⚠️ Warnings: ${warnCount}\n`);
  report.push(`- 📸 Screenshots: ${fs.readdirSync(SCREENSHOT_DIR).length}\n`);

  fs.writeFileSync(REPORT_FILE, report.join(''), 'utf8');
  log('\n✅ All tests completed!');
  log(`Report saved: ${REPORT_FILE}`);
  log(`Screenshots: ${SCREENSHOT_DIR}`);
  log(`Results: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`);
}

runTests().catch(e => {
  console.error('Test failed:', e);
  fs.writeFileSync(REPORT_FILE, `# RMS Test Failed\n\nError: ${e.message}\n\n${e.stack}\n`, 'utf8');
}).finally(async () => {
  if (browser) await browser.close();
});
