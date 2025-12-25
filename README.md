# Webpage Change Tracker + AI Summary

This Apify actor is a powerful tool for monitoring any webpage for changes. It goes beyond simple text comparison by offering a choice between clean text diffing and a more granular HTML diff. When changes are detected, it can provide a human-readable summary of what changed and why it might matter, powered by the latest AI models.

## Key Features

-   **Dual Diffing Modes**: Choose between a simple, readable **text diff** or a detailed, structural **HTML diff**.
-   **AI-Powered Summaries**: Get clear, concise explanations of any changes, powered by your choice of leading AI models.
-   **Bring Your Own AI Key**: Integrate seamlessly with OpenAI, Google Gemini, or any model on OpenRouter.
-   **Simple, Clean UX**: Just provide a URL, and the actor handles the rest.

## A Note from the Developer

I am a solo student developer, and I'm participating in the Apify competition with the goal of helping to pay for my tuition. Your support and feedback mean the world to me. Thank you for trying out my actor!

## How to Use

### Input Configuration

The actor is designed to be very simple to use. Here are the available input options:

| Field             | Description                                                                          |
| ----------------- | ------------------------------------------------------------------------------------ |
| **Webpage URL**   | The URL of the webpage you want to monitor.                                          |
| **Enable AI summary** | A simple toggle to turn the AI summary feature on or off.                            |
| **AI Provider**   | Choose between `openai`, `gemini`, or `openrouter`.                                    |
| **OpenRouter Model** | If you select `openrouter`, you can specify any model available on their platform. |
| **AI API Key**    | Your API key for the selected provider.                                              |
| **Diff Type**     | Choose `text` for a clean diff or `html` for a structural one.                         |

### Bring Your Own AI Key

This actor supports several AI providers. To use the AI summary feature, you'll need to provide your own API key.

-   **OpenAI**: Uses the `gpt-4o` model.
-   **Google Gemini**: Uses the `gemini-1.5-flash` model.
-   **OpenRouter**: Defaults to `qwen/qwen-3-coder-480b-a35b` (a powerful, free model), but you can specify any model available on their platform.

## Output Examples

The actor's output is designed to be clear and easy to understand. Here’s what you can expect:

### Text Diff Example

When `diffType` is set to `text`, the `changedSections` array will show you the exact text that was added or removed.

```json
{
  "changed": true,
  "changedSections": [
    {
      "type": "addition",
      "value": "New and Improved "
    },
    {
      "type": "deletion",
      "value": "Old "
    }
  ],
  "summary": "The main headline was updated to highlight that the product is 'New and Improved', replacing the previous 'Old' version.",
  "timestamp": "2025-12-24T12:00:00.000Z"
}
```

### HTML Diff Example

When `diffType` is set to `html`, you’ll see the raw HTML changes, including any new tags or attributes.

```json
{
  "changed": true,
  "changedSections": [
    {
      "type": "addition",
      "content": "<strong>Special Offer</strong>"
    },
    {
      "type": "deletion",
      "content": "<p>Old Offer</p>"
    }
  ],
  "summary": "A new 'Special Offer' section was added to the page, replacing the previous offer.",
  "timestamp": "2025-12-24T12:00:00.000Z"
}
```
