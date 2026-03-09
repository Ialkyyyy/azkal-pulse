# azkal-pulse

**Instant site audit with AI-powered fix suggestions.** One-click performance, SEO, and accessibility checks for any webpage -- plus copy-paste code fixes and client-ready PDF reports.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Why azkal-pulse?

Lighthouse tells you what's wrong. **azkal-pulse tells you how to fix it** with actual code you can copy and paste.

- **One-click audits** -- performance, SEO, and accessibility scores in seconds
- **35+ deep checks** -- render-blocking resources, missing alt text, heading order, page weight, DOMContentLoaded, SSL meta, and more
- **AI-powered fixes** -- Claude AI generates real code snippets to resolve each issue
- **Score comparison** -- see +/- deltas against your previous audit for the same URL
- **Client Report Mode** -- export a professional PDF or copy a text summary to clipboard
- **Audit history** -- track scores over time for any site with colored score indicators
- **Settings page** -- easily configure your API key right in the extension

## For Freelancers

The Client Report feature generates a professional PDF audit report you can send directly to prospects or existing clients. Show them exactly what's wrong with their site and how you'd fix it -- a natural upsell for your dev services.

## Installation

### Manual (Development)

1. Clone the repo:
   ```bash
   git clone https://github.com/Ialkyyyy/azkal-pulse.git
   cd azkal-pulse
   npm install
   npm run build
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder

### API Key Setup

To use AI-powered fix suggestions:
1. Click the azkal-pulse extension icon
2. Go to the **Settings** tab
3. Paste your Anthropic API key and click **Save API Key**
4. Get your key at [console.anthropic.com](https://console.anthropic.com)

## How It Works

1. Navigate to any webpage
2. Click the azkal-pulse extension icon
3. Hit "Run Audit" -- watch the scanning animation and scores appear
4. Review issues grouped by category with severity indicators
5. Click "Get AI Fix Suggestions" for code-level fixes
6. Export a PDF report for your client

## Tech Stack

- **Chrome Extension** -- Manifest V3
- **Frontend** -- React + Tailwind CSS
- **AI** -- Claude API for fix suggestions
- **PDF** -- jsPDF for client reports
- **Build** -- Vite

## Development

```bash
npm install
npm run dev     # Dev server for popup UI
npm run build   # Production build for extension
```

## Contributing

Contributions welcome! Open an issue or submit a PR.

## License

[MIT](LICENSE) -- Built with care by [Alkhabaz-Dev](https://github.com/Ialkyyyy)
