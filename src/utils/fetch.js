import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';

export async function fetchPageContent(url, proxyConfiguration) {
    const response = await gotScraping({
        url,
        proxyUrl: proxyConfiguration ? await proxyConfiguration.newUrl() : undefined,
        timeout: { request: 20000 },
    });
    const html = response.body;
    const $ = cheerio.load(html);

    // Create a clean version of the HTML for text diffing
    const clean$ = cheerio.load(html);
    clean$('script, style, noscript').remove();
    const text = clean$('body').text().replace(/\s+/g, ' ').trim();

    return {
        html,
        text,
    };
}
