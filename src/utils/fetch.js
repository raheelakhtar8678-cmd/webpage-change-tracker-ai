import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';

// A set of block-level HTML tags.
const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'li', 'ul', 'ol', 'tr', 'td', 'th', 'br', 'hr', 'article', 'section', 'header', 'footer', 'nav', 'aside']);

/**
 * Recursively traverses the DOM and extracts text, adding spaces between block-level elements.
 * @param {cheerio.Element} node The current node to process.
 * @param {cheerio.CheerioAPI} $ The Cheerio instance.
 * @returns {string} The extracted text with proper spacing.
 */
function getTextWithSpacing(node, $) {
    let text = '';
    if (node.type === 'text') {
        text += $(node).text();
    } else if (node.type === 'tag') {
        // Recursively get text from child nodes
        $(node).contents().each((_, child) => {
            text += getTextWithSpacing(child, $);
        });

        // Add a space after block-level elements to ensure separation
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

    // Remove scripts, styles, and other non-visible elements
    $('script, style, noscript, svg, header, footer, nav').remove();

    // Extract text with intelligent spacing
    let extractedText = getTextWithSpacing($('body')[0], $);

    // Normalize whitespace to a single space
    extractedText = extractedText.replace(/\s+/g, ' ').trim();

    return {
        html,
        text: extractedText,
    };
}
