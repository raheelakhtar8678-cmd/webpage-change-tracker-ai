import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';

function getTextWithSpacing(node, $) {
    let text = '';
    if (node.type === 'text') {
        text += $(node).text().trim() + ' ';
    } else if (node.type === 'tag' && node.name !== 'script' && node.name !== 'style') {
        $(node).contents().each((_, child) => {
            text += getTextWithSpacing(child, $);
        });
    }
    return text;
}

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
    const text = getTextWithSpacing($('body')[0], clean$).replace(/\s+/g, ' ').trim();

    return {
        html,
        text,
    };
}
