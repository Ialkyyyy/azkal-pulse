# azkal-pulse

**Instant site audit with AI-powered fix suggestions.** One-click performance, SEO, and accessibility checks for any webpage -- plus copy-paste code fixes and client-ready PDF reports.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Why azkal-pulse?

Lighthouse tells you what's wrong. **azkal-pulse tells you how to fix it** with actual code you can copy and paste.

- **One-click audits** -- performance, SEO, and accessibility scores in seconds
- **AI-powered fixes** -- Claude AI generates real code snippets to resolve each issue
- **Client Report Mode** -- export a branded PDF report to send to clients
- **Audit history** -- track scores over time for any site

## For Freelancers

The Client Report feature generates a professional PDF audit report you can send directly to prospects or existing clients. Show them exactly what's wrong with their site and how you'd fix it -- a natural upsell for your dev services.

## Installation

### Manual (Development)

1. Clone the repo:
   ```bash
   git clone https://github.com/Alkhabaz-Dev/azkal-pulse.git
   cd azkal-pulse
   npm install
   npm run build
   ```
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder

### API Key Setup

To use AI-powered fix suggestions, store your Anthropic API key:
1. Open the extension popup
2. Go to Settings (coming in v1.1) or set via Chrome DevTools console:
   ```js
   chrome.storage.local.set({ anthropic_api_key: "your-key-here" });
   ```

## How It Works

1. Navigate to any webpage
2. Click the azkal-pulse extension icon
3. Hit "Run Audit" -- scores appear instantly
4. Click "Get AI Fix Suggestions" for code-level fixes
5. Export a PDF report for your client

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

[MIT](LICENSE) -- Built with care by [Alkhabaz-Dev](https://github.com/Alkhabaz-Dev)
