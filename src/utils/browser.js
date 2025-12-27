import { chromium } from 'playwright';
import { Actor, log } from 'apify';

export async function captureScreenshot(url) {
    log.info(`Launching browser to capture screenshot of ${url}`);

    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 }
        });
        const page = await context.newPage();

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Wait for a few seconds for dynamic content/animations to settle
        await page.waitForTimeout(2000);

        // Wait specifically for body to ensure content is painted
        await page.waitForSelector('body');

        // Take a screenshot of the full page or just the visible area?
        // Full page is better for change detection.
        const buffer = await page.screenshot({ fullPage: true, type: 'png', timeout: 60000 });

        return buffer;
    } catch (error) {
        log.error(`Screenshot capture failed: ${error.message}`);
        throw error;
    } finally {
        await browser.close();
    }
}
