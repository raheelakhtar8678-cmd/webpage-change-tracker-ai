import axios from 'axios';
import * as cheerio from 'cheerio';

export async function fetchPageContent(url) {
    const response = await axios.get(url, { timeout: 20000 });
    const html = response.data;
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
