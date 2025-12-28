# Webpage Change Tracker + AI Summary

Monitor any webpage for visual and text changes. Get premium, AI-powered reports delivered directly to your dashboard.

---

## 🚀 Quick Start Guide

### Step 1: Input Setup
1.  **Webpage URL**: Enter the URL you want to track (e.g., `https://apnews.com/`).
2.  **Toggle AI summary**: Turn this on to get a human-readable explanation of changes.
3.  **Choose Provider & Key**:
    -   Select **openai**, **google**, or **openrouter**.
    -   **Important**: Put your API key in the *specific* field for that provider (e.g., if using OpenRouter, use the `OpenRouter API Key` field).
4.  **Pick a Model**: Use a preset or choose **"CUSTOM"** to type in any ID (e.g., `qwen/qwen-2.5-72b-instruct`).

### Step 2: Run the Actor
-   Click the **Start** button.
-   **Baseline Run**: The first time you run it for a URL, it saves a "snapshot".
-   **Comparison Run**: Every run after that will compare the current page against that snapshot.

### Step 3: View Results
-   **Dataset**: Click the **Dataset** tab to see the raw JSON data of changes.
-   **Visual Report**: Click the **Key-value store** tab and open **`report.html`**. 
    -   *Tip*: This is where you'll see the premium dashboard with visual heatmaps and AI analysis.

---

## 🛠 Features

### 1. Premium Visual Dashboard
The generated `report.html` is a state-of-the-art dashboard featuring:
-   **Visual Heatmap**: High-fidelity diffs highlighting exactly where things moved or changed on the page.
-   **AI Analysis**: A concise "Executive Summary" explaining *what* changed and *why* it matters.
-   **Clean Diffs**: Beautifully formatted text changes with syntax highlighting.

### 2. Smart AI Resolution
-   **Automatic Formats**: If you use OpenRouter, just type the model name (e.g., `gemini-2.0-flash`). The actor automatically adds the necessary prefixes (`google/`) and suffixes (`:free`) for you.
-   **Secure Inputs**: Your API keys are masked for security but remain easy to edit in the form.

### 3. Robust Comparison
-   **Dynamic Height Handling**: Automatically handles pages that grow or shrink in length without crashing.
-   **Pixel-Perfect Detection**: even minor CSS or layout shifts are caught.

---

## 📂 Understanding Outputs

### Key-Value Store (`report.html`)
This is the primary output for humans. It contains the beautiful dark-themed report you can open in any browser.

### Dataset (JSON)
Perfect for developers or automation.
```json
{
  "url": "https://example.com",
  "changed": true,
  "status": "CHANGED",
  "aiSummary": "The pricing section was updated from $10 to $12...",
  "visualChangePercent": 12.5,
  "changes": [...]
}
```

---

## 💡 Pro Tips
-   **Free AI**: Use the `openrouter` provider with a model ID like `google/gemini-2.0-flash-lite-preview-02-05:free` for high-quality summaries at zero cost.
-   **Visual Only?**: If you don't need AI, just toggle it off to save credits. The visual and text diffs will still work perfectly.

---

*Developed with passion for the Apify competition. Thank you for your support!*

