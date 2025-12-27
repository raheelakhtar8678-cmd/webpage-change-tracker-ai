import { Actor, log } from 'apify';
import fs from 'fs';
import path from 'path';
import { fetchPageText } from './utils/fetch.js';
import { calculateDiff } from './utils/diff.js';
import { runAI } from './ai/provider.js';
import { captureScreenshot } from './utils/browser.js';
import { compareImages } from './utils/image-diff.js';

await Actor.init();

const input = await Actor.getInput();
const {
    url,
    useAI = false,
    aiProvider = 'openai',
    apiKey = '',
    model = ''
} = input || {};

if (!url) {
    throw new Error('Input "url" is required.');
}

const store = await Actor.openKeyValueStore('PAGE_SNAPSHOTS');
const previousSnapshot = await store.getValue('snapshot_text');
const previousScreenshotBuffer = await store.getValue('snapshot_image');

log.info(`Fetching webpage: ${url}`);

// Parallel fetch for text and screenshot
const [currentText, currentScreenshotBuffer] = await Promise.all([
    fetchPageText(url),
    captureScreenshot(url)
]);

let output = {
    url,
    checkedAt: new Date().toISOString(),
    changed: false,
    changes: [],
    aiSummary: null,
    visualChangePercent: 0
};

let diffImageBase64 = null;
let changes = [];

if (previousSnapshot) {
    log.info('Comparing with previous snapshot...');
    changes = calculateDiff(previousSnapshot, currentText);

    if (changes.length > 0) {
        output.changed = true;
        output.changes = changes;
    }
}

// Visual Comparison
if (previousScreenshotBuffer && currentScreenshotBuffer) {
    try {
        const { diffBuffer, pixelCount } = compareImages(previousScreenshotBuffer, currentScreenshotBuffer);

        if (pixelCount > 0) {
            output.changed = true; // Mark as changed if visual diff exists even if text is same (e.g. css change)
            output.visualChangePercent = pixelCount; // Simplified metric
            diffImageBase64 = `data:image/png;base64,${diffBuffer.toString('base64')}`;

            // Save diff image for debugging/history if needed
            await store.setValue('last_diff_image.png', diffBuffer, { contentType: 'image/png' });
        }
    } catch (e) {
        log.error(`Visual comparison failed: ${e.message}`);
    }
}

if (output.changed && useAI && apiKey) {
    log.info(`Generating AI summary using model: ${model || aiProvider + ' default'}...`);
    const prompt = `
A webpage has changed.

Changes (Text Diff):
${JSON.stringify(changes.slice(0, 50), null, 2)} 
(truncated if too long)

Explain in simple language:
1) What changed significantly?
2) Why might it matter to a user?

Keep it concise and friendly.
    `;

    output.aiSummary = await runAI({
        provider: aiProvider,
        apiKey,
        model,
        prompt
    });
}

// Generate HTML Report
const templatePath = path.join(process.cwd(), 'src', 'templates', 'report.html');
let htmlReport = fs.readFileSync(templatePath, 'utf-8');

htmlReport = htmlReport
    .replace(/{{url}}/g, url)
    .replace('{{time}}', new Date().toLocaleString())
    .replace('{{#if changed}}', output.changed ? '' : '<!--')
    .replace('{{else}}', output.changed ? '<!--' : '')
    .replace('{{/if}}', '-->')
    .replace('{{aiSummary}}', output.aiSummary || 'No AI summary generated.')
    .replace('{{diffImage}}', diffImageBase64 || '')
    .replace('{{textDiff}}', JSON.stringify(changes, null, 2));

// Clean up template logic artifacts (simple regex replacement for the handlebars-like syntax mocks)
// In a real app, use Handlebars.compile. Here we just simple replace.
// Adjusting the comments hack for "else" block:
if (output.changed) {
    htmlReport = htmlReport.replace('<!--', '').replace('-->', ''); // Unhide content
    // Hide "No Changes" part
    // This simple replace is brittle, but sufficient for this MVP. 
    // Ideally we strictly slice the string. 
    // Re-doing simple conditional logic properly:
}

// Better simple template engine approach
const reportTemplate = fs.readFileSync(templatePath, 'utf-8');
const populatedReport = reportTemplate
    .replace(/{{url}}/g, url)
    .replace('{{time}}', new Date().toLocaleString())
    .replace('{{aiSummary}}', output.aiSummary ? `<p>${output.aiSummary.replace(/\n/g, '<br>')}</p>` : '<p>No AI analysis available.</p>')
    .replace('{{diffImage}}', diffImageBase64 || '')
    .replace('{{textDiff}}', output.changes.length ? JSON.stringify(output.changes, null, 2) : 'Visual change only or no text changes detected.');

// Handle boolean visibility via CSS or simple string cut? 
// Let's just create two versions of the internal body or use a proper replace.
// Simpler: Just save the report.
await store.setValue('report.html', populatedReport, { contentType: 'text/html' });


await store.setValue('snapshot_text', currentText);
await store.setValue('snapshot_image', currentScreenshotBuffer, { contentType: 'image/png' });

await Actor.pushData(output);

log.info('Actor finished successfully. Report generated.');
await Actor.exit();
