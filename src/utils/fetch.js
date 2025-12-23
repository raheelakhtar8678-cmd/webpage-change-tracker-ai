import axios from 'axios';
import cheerio from 'cheerio';

export async function fetchPageText(url) {
    const response = await axios.get(url, { timeout: 20000 });
    const html = response.data;
    const $ = cheerio.load(html);

    // Remove scripts & styles
    $('script, style, noscript').remove();

    return $('body').text().replace(/\s+/g, ' ').trim();
}