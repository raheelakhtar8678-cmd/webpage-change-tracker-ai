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
const maskedInput = { ...input };
for (const key in maskedInput) {
    if (key.toLowerCase().includes('key')) maskedInput[key] = '***';
}
log.info('Received Input:', JSON.stringify(maskedInput, null, 2));

const {
    url,
    useAI = false,
    aiProvider = 'openai',
    // New specific key fields
    openaiApiKey = '',
    googleApiKey = '',
    openRouterApiKey = '',
    // New fields from schema update
    modelPreset = 'gemini-2.0-flash-lite-preview-02-05',
    customModel = '',
    // Legacy support
    model: legacyModel = '',
    openRouterModel = ''
} = input || {};

// Resolve API Key based on provider
let resolvedApiKey = '';
let keySource = 'none';

if (aiProvider === 'openai' && openaiApiKey) {
    resolvedApiKey = openaiApiKey;
    keySource = 'openaiApiKey';
} else if (aiProvider === 'google' && googleApiKey) {
    resolvedApiKey = googleApiKey;
    keySource = 'googleApiKey';
} else if (aiProvider === 'openrouter' && openRouterApiKey) {
    resolvedApiKey = openRouterApiKey;
    keySource = 'openRouterApiKey';
}

if (useAI) {
    log.info(`API Resolution: Provider=${aiProvider}, KeySource=${keySource}${resolvedApiKey ? ' (Set)' : ' (Missing)'}`);
}

// Determine the final model to use (Priority: Custom > Legacy 'model' > Preset)
let model = '';
if (modelPreset === 'CUSTOM' && customModel) {
    model = customModel;
} else if (legacyModel || openRouterModel) {
    model = legacyModel || openRouterModel;
} else if (modelPreset && modelPreset !== 'CUSTOM') {
    // Only use preset if it actually belongs to the current provider (rough check)
    const isGeminiPreset = modelPreset.startsWith('gemini');
    const isGPTPreset = modelPreset.startsWith('gpt');

    if (aiProvider === 'openai' && isGPTPreset) model = modelPreset;
    else if (aiProvider === 'google' && isGeminiPreset) model = modelPreset;
    else if (aiProvider === 'openrouter') model = modelPreset;
    else {
        log.warning(`Model preset "${modelPreset}" might not be compatible with provider "${aiProvider}". Using default instead.`);
        model = ''; // Let provider handle default
    }
} else {
    model = '';
}

if (!url) {
    throw new Error('Input "url" is required.');
}

const store = await Actor.openKeyValueStore('page-snapshots');
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
    visualChangePercent: 0,
    status: null // 'INITIAL_RUN', 'CHANGED', 'NO_CHANGE'
};

let diffImageBase64 = null;
let changes = [];

if (previousSnapshot) {
    log.info('Comparing with previous snapshot...');
    changes = calculateDiff(previousSnapshot, currentText);

    if (changes.length > 0) {
        output.changed = true;
        output.changes = changes;
        output.status = 'CHANGED';
    } else {
        output.status = 'NO_CHANGE';
    }
} else {
    log.info('No previous snapshot found. Saving baseline.');
    output.status = 'INITIAL_RUN';
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

if (output.changed && useAI && resolvedApiKey) {
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
        apiKey: resolvedApiKey,
        model,
        prompt
    });
} else if (output.changed) {
    if (!useAI) log.warning('AI summary skipped: "useAI" input is false.');
    if (!resolvedApiKey) log.warning('AI summary skipped: "apiKey" input is missing.');
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
    .replace('{{#if firstRun}}', output.status === 'INITIAL_RUN' ? '' : '<!--')
    .replace('{{/if firstRun}}', '-->')
    .replace('{{aiSummary}}', output.aiSummary || 'No AI summary generated.')
    .replace('{{diffImage}}', diffImageBase64 || '')
    .replace('{{textDiff}}', JSON.stringify(changes, null, 2));

// Clean up template logic artifacts (simple regex replacement for the handlebars-like syntax mocks)
// In a real app, use Handlebars.compile. Here we just simple replace.
// Adjusting the comments hack for "else" block:
if (output.changed) {
    htmlReport = htmlReport.replace('<!--', '').replace('-->', '');
}
if (output.status === 'INITIAL_RUN') {
    // Unhide firstRun block if it exists (simulating handlebars)
    // Note: The simple regex approach above strictly works for 1 block. 
    // For multiple blocks, we need a better replacer or just use the populated string at the end.
    // Since we are moving to the "Better simple template engine approach" below, 
    // let's rely on that instead of this brittle block.
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
// Simpler: Just save the report to the DEFAULT store so the output schema can find it
await Actor.setValue('report.html', populatedReport, { contentType: 'text/html' });

// Keep snapshots in the named store
await store.setValue('snapshot_text', currentText);
await store.setValue('snapshot_image', currentScreenshotBuffer, { contentType: 'image/png' });

await Actor.pushData(output);

log.info('Actor finished successfully. Report generated.');
await Actor.exit();
