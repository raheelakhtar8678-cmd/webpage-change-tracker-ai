import { Actor, log } from 'apify';
import { fetchPageText } from './utils/fetch.js';
import { calculateDiff } from './utils/diff.js';
import { runAI } from './ai/provider.js';

await Actor.init();

const input = await Actor.getInput();
const {
    url,
    useAI = false,
    aiProvider = 'openai',
    apiKey = ''
} = input || {};

if (!url) {
    throw new Error('Input "url" is required.');
}

const store = await Actor.openKeyValueStore('page-snapshots');
const previousSnapshot = await store.getValue('snapshot');

log.info(`Fetching webpage: ${url}`);
const currentSnapshot = await fetchPageText(url);

let output = {
    url,
    checkedAt: new Date().toISOString(),
    changed: false,
    changes: [],
    aiSummary: null
};

if (previousSnapshot) {
    const changes = calculateDiff(previousSnapshot, currentSnapshot);

    if (changes.length > 0) {
        output.changed = true;
        output.changes = changes;

        if (useAI && apiKey) {
            const prompt = `
A webpage has changed.

Explain in simple language:
1) What changed
2) Why it might matter to a user

Changes:
${JSON.stringify(changes, null, 2)}
            `;

            output.aiSummary = await runAI({
                provider: aiProvider,
                apiKey,
                prompt
            });
        }
    }
}

await store.setValue('snapshot', currentSnapshot);
await Actor.pushData(output);

log.info('Actor finished successfully.');
await Actor.exit();
