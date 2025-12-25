import { Actor, log, ProxyConfiguration } from 'apify';
import { fetchPageContent } from './utils/fetch.js';
import { calculateTextDiff, calculateHtmlDiff } from './utils/diff.js';
import { runAI } from './ai/provider.js';

await Actor.init();

const proxyConfiguration = await Actor.createProxyConfiguration();

const input = await Actor.getInput();
const {
    url,
    useAI = false,
    aiProvider = 'openai',
    model, // Unified model input
    apiKey = '',
    diffType = 'text',
} = input || {};

if (!url) {
    throw new Error('Input "url" is required.');
}

const store = await Actor.openKeyValueStore('page-snapshots');
const previousSnapshot = await store.getValue('snapshot') || {};

log.info(`Fetching webpage: ${url}`);
const currentContent = await fetchPageContent(url, proxyConfiguration);

let changed = false;
let changedSections = [];

if (previousSnapshot.text) {
    if (diffType === 'text') {
        changedSections = calculateTextDiff(previousSnapshot.text, currentContent.text);
    } else {
        changedSections = calculateHtmlDiff(previousSnapshot.html, currentContent.html);
    }

    if (changedSections.length > 0) {
        changed = true;
    }
}

let summary = null;
if (changed && useAI && apiKey) {
    const prompt = `
A webpage has changed.

Explain in simple language:
1) What changed
2) Why it might matter to a user

Changes:
${JSON.stringify(changedSections, null, 2)}
    `;

    summary = await runAI({
        provider: aiProvider,
        apiKey,
        model, // Pass the unified model to the AI provider
        prompt,
    });
}

await store.setValue('snapshot', currentContent);

await Actor.pushData({
    changed,
    changedSections,
    summary,
    timestamp: new Date().toISOString(),
});

log.info('Actor finished successfully.');
await Actor.exit();
