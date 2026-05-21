import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # Track failed requests
        failed_requests = []
        def handle_route(route, request):
            if request.resource_type == "xhr" or request.resource_type == "fetch":
                print(f"API Request: {request.method} {request.url}")
            route.continue_()
        
        page.on("response", lambda response: print(f"Response: {response.status} {response.url}") if response.status >= 400 else None)
        page.on("requestfailed", lambda request: failed_requests.append(f"{request.method} {request.url}: {request.failure}"))
        
        await page.route("**/*", handle_route)
        
        await page.goto('http://100.73.184.77:3000')
        await page.wait_for_timeout(3000)
        
        print(f"\nFailed requests: {failed_requests}")
        
        await page.screenshot(path='/tmp/rms_network.png', full_page=True)
        await browser.close()

asyncio.run(main())
