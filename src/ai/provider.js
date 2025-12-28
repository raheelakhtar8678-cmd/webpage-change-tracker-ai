import axios from 'axios';
import { log } from 'apify';

export async function runAI({ provider, apiKey, model, prompt }) {
    if (!apiKey) return null;

    try {
        if (provider === 'openai') {
            const res = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: model || 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.3
                },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return res.data.choices[0].message.content;
        }

        if (provider === 'gemini' || provider === 'google') {
            const modelId = model || 'gemini-2.0-flash-lite-preview-02-05';
            // Simple mapping if user provides short names, else assume correct format
            const cleanModel = modelId.includes('/') ? modelId.split('/')[1] : modelId;

            const res = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent`,
                {
                    contents: [{ parts: [{ text: prompt }] }]
                },
                {
                    headers: {
                        'x-goog-api-key': apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return res.data.candidates[0].content.parts[0].text;
        }

        if (provider === 'openrouter') {
            let finalModel = (model || 'google/gemini-2.0-flash-lite-preview-02-05:free').trim();

            // If model looks like a bare ID (no /), try to prefix it for common models
            if (!finalModel.includes('/')) {
                if (finalModel.includes('gemini')) finalModel = `google/${finalModel}`;
                else if (finalModel.includes('gpt')) finalModel = `openai/${finalModel}`;
                else if (finalModel.includes('claude')) finalModel = `anthropic/${finalModel}`;
            }

            // OpenRouter often needs :free or specific IDs.
            // If it's specifically our gemini-2.0 preset ID, ensure it has the :free suffix if bare.
            if (finalModel.includes('google/gemini-2.0-flash-lite-preview-02-05') && !finalModel.includes(':')) {
                finalModel = 'google/gemini-2.0-flash-lite-preview-02-05:free';
            }

            log.info(`Final OpenRouter model string: "${finalModel}"`);

            const res = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: finalModel,
                    messages: [{ role: 'user', content: prompt }]
                },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return res.data.choices[0].message.content;
        }
    } catch (error) {
        console.error(`AI Provider (${provider}) Error:`, error.response?.data || error.message);
        return `Error generating summary: ${error.message}`;
    }

    return null;
}
