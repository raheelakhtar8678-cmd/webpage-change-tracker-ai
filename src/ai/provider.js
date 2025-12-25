import { gotScraping } from 'got-scraping';

/**
 * A robust handler for OpenAI-style API responses (used by OpenAI and OpenRouter).
 * It checks for HTTP errors, API-specific errors, and invalid response structures.
 * @param {object} response The response object from gotScraping.
 * @param {string} providerName The name of the AI provider for clear error messages.
 * @returns {string} The content of the AI's message.
 */
function handleOpenAIStyleResponse(response, providerName) {
    const { body, statusCode } = response;

    // Check for non-2xx status codes and specific API errors in the body.
    if (statusCode !== 200 || body.error) {
        const errorMessage = body.error ? body.error.message : `Received HTTP status ${statusCode}`;
        throw new Error(`${providerName} API Error: ${errorMessage}`);
    }

    if (!body.choices || body.choices.length === 0 || !body.choices[0].message) {
        throw new Error(`${providerName} API Error: Received an empty or invalid response structure.`);
    }

    return body.choices[0].message.content;
}

async function queryOpenAI(apiKey, prompt) {
    const response = await gotScraping({
        url: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        json: { model: 'gpt-4o', messages: [{ role: 'user', content: prompt }] },
        responseType: 'json',
        throwHttpErrors: false, // Handle HTTP errors manually for better error messages.
    });
    return handleOpenAIStyleResponse(response, 'OpenAI');
}

async function queryGemini(apiKey, prompt) {
    const response = await gotScraping({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        json: { contents: [{ parts: [{ text: prompt }] }] },
        responseType: 'json',
        throwHttpErrors: false,
    });

    const { body, statusCode } = response;

    if (statusCode !== 200 || body.error) {
        const errorMessage = body.error ? body.error.message : `Received HTTP status ${statusCode}`;
        throw new Error(`Gemini API Error: ${errorMessage}`);
    }

    if (!body.candidates || body.candidates.length === 0 || !body.candidates[0].content) {
        throw new Error('Gemini API Error: Received an empty or invalid response structure.');
    }

    return body.candidates[0].content.parts[0].text;
}

async function queryOpenRouter(apiKey, model, prompt) {
    const response = await gotScraping({
        url: 'https://openrouter.ai/api/v1/chat/completions',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        json: { model, messages: [{ role: 'user', content: prompt }] },
        responseType: 'json',
        throwHttpErrors: false,
    });
    return handleOpenAIStyleResponse(response, 'OpenRouter');
}

export async function runAI({ provider, apiKey, model, prompt }) {
    // Wrap the entire execution in a try-catch to handle network/parsing errors from gotScraping.
    try {
        switch (provider) {
            case 'openai':
                return await queryOpenAI(apiKey, prompt);
            case 'gemini':
                return await queryGemini(apiKey, prompt);
            case 'openrouter':
                return await queryOpenRouter(apiKey, model, prompt);
            default:
                throw new Error(`Unsupported AI provider: ${provider}`);
        }
    } catch (error) {
        // If it's one of our custom API errors, re-throw it.
        if (error.message.includes('API Error:')) {
            throw error;
        }
        // Otherwise, wrap it as a generic AI query failure.
        throw new Error(`Failed to query AI provider '${provider}': ${error.message}`);
    }
}
