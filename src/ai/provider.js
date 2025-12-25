import { gotScraping } from 'got-scraping';

async function queryOpenAI(apiKey, prompt) {
    const response = await gotScraping({
        url: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        json: {
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
        },
        responseType: 'json',
    });
    return response.body.choices[0].message.content;
}

async function queryGemini(apiKey, prompt) {
    const response = await gotScraping({
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        json: {
            contents: [{ parts: [{ text: prompt }] }],
        },
        responseType: 'json',
    });
    return response.body.candidates[0].content.parts[0].text;
}

async function queryOpenRouter(apiKey, model, prompt) {
    const response = await gotScraping({
        url: 'https://openrouter.ai/api/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        json: {
            model: model,
            messages: [{ role: 'user', content: prompt }],
        },
        responseType: 'json',
    });
    return response.body.choices[0].message.content;
}

export async function runAI({ provider, apiKey, model, prompt }) {
    switch (provider) {
        case 'openai':
            return queryOpenAI(apiKey, prompt);
        case 'gemini':
            return queryGemini(apiKey, prompt);
        case 'openrouter':
            return queryOpenRouter(apiKey, model, prompt);
        default:
            throw new Error(`Unsupported AI provider: ${provider}`);
    }
}
