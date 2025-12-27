import axios from 'axios';
import * as cheerio from 'cheerio';

export async function fetchPageText(url) {
    const response = await axios.get(url, { timeout: 20000 });
    const html = response.data;
    const $ = cheerio.load(html);

    // Remove scripts & styles
    $('script, style, noscript').remove();

    // Add spaces/newlines to block elements to prevent "7KCalifornia" concatenation
    $('div, p, h1, h2, h3, h4, h5, h6, li, tr').each((_, el) => {
        $(el).append(' ');
    });

    // Replace line breaks with spaces first to normalize
    return $('body').text().replace(/\s+/g, ' ').trim();
}