import axios from 'axios';

export async function runAI({ provider, apiKey, model, prompt }) {
    if (!apiKey) return null;

    try {
        if (provider === 'openai') {
            const res = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: model || 'gpt-4o', // Use user-provided model or default
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
            // Google uses the model in the URL path: models/gemini-2.0-flash-lite-preview-02-05:generateContent
            const modelName = model || 'gemini-2.0-flash-lite-preview-02-05';
            // Simple mapping if user provides short names, else assume correct format or fix typical variants
            const cleanModel = modelName.includes('/') ? modelName.split('/')[1] : modelName;

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
            const res = await axios.post(
                'https://openrouter.ai/api/v1/chat/completions',
                {
                    model: model || 'openai/gpt-4o',
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
