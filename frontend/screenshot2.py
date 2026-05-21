import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page error: {err}"))
        
        response = await page.goto('http://100.73.184.77:3000')
        print(f"Page status: {response.status}")
        
        await page.wait_for_timeout(5000)
        
        # Check for error messages
        error_text = await page.locator('text=/Error|Failed|error/i').count()
        print(f"Error elements found: {error_text}")
        
        await page.screenshot(path='/tmp/rms_debug.png', full_page=True)
        await browser.close()
        print('Screenshot saved: /tmp/rms_debug.png')

asyncio.run(main())
