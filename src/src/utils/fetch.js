import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';

// A set of block-level HTML tags that should have a space after them.
const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'li', 'ul', 'ol', 'tr', 'td', 'th', 'br', 'hr', 'article', 'section']);

/**
 * Recursively traverses the DOM and extracts text, adding spaces between block-level elements.
 * @param {cheerio.Element} node The current node to process.
 * @param {cheerio.CheerioAPI} $ The Cheerio instance.
 * @returns {string} The extracted text with proper spacing.
 */
function getTextWithSpacing(node, $) {
    let text = '';
    if (node.type === 'text') {
        // Add the text content, and ensure it has a space at the end if it's not just whitespace.
        const nodeText = $(node).text();
        if (nodeText.trim().length > 0) {
            text += nodeText + ' ';
        }
    } else if (node.type === 'tag') {
        // Recursively get text from child nodes.
        $(node).contents().each((_, child) => {
            text += getTextWithSpacing(child, $);
        });

        // Add a space after block-level elements to ensure separation.
        if (BLOCK_TAGS.has(node.name)) {
            text += ' ';
        }
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

    // Remove scripts, styles, and other non-visible elements that clutter the text.
    $('script, style, noscript, svg, header, footer, nav, aside, form, [role="navigation"], [role="search"]').remove();

    // Extract text with intelligent spacing from the body.
    let extractedText = getTextWithSpacing($('body')[0], $);

    // Normalize whitespace to a single space to clean up the final output.
    extractedText = extractedText.replace(/\s+/g, ' ').trim();

    return {
        html,
        text: extractedText,
    };
}
