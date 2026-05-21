import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto('http://100.73.184.77:3000')
        await page.wait_for_timeout(3000)
        await page.screenshot(path='/tmp/rms_page.png', full_page=True)
        await browser.close()
        print('Screenshot saved: /tmp/rms_page.png')

asyncio.run(main())
