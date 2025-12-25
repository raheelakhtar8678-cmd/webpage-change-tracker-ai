import { diffWords } from 'diff';
import { htmlDiff } from '@benedicte/html-diff';
import * as cheerio from 'cheerio';

/**
 * Calculates the difference between two text strings.
 */
export function calculateTextDiff(before, after) {
    const changes = diffWords(before, after);
    const formattedChanges = changes.map(part => ({
        type: part.added ? 'addition' : part.removed ? 'deletion' : 'no-change',
        value: part.value,
    }));
    return formattedChanges.filter(c => c.type !== 'no-change');
}

/**
 * Calculates the difference between two HTML strings and returns a structured format.
 */
export function calculateHtmlDiff(before, after) {
    const rawDiff = htmlDiff(before, after);
    const $ = cheerio.load(rawDiff, null, false); // Use htmlparser2 to avoid adding <html><body> tags

    const changedSections = [];

    $('ins').each((_, el) => {
        changedSections.push({
            type: 'addition',
            content: $(el).html(), // Use .html() to preserve inner tags
        });
    });

    $('del').each((_, el) => {
        changedSections.push({
            type: 'deletion',
            content: $(el).html(),
        });
    });

    return changedSections;
}
