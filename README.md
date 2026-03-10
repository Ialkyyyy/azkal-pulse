# azkal-pulse

**Instant site audit with AI-powered fix suggestions.** One-click performance, SEO, and accessibility checks for any webpage — plus copy-paste code fixes and client-ready reports.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Why azkal-pulse?

Lighthouse tells you what's wrong. **azkal-pulse tells you how to fix it** with actual code you can copy and paste.

- **One-click audits** — performance, SEO, and accessibility scores in seconds
- **40+ deep checks** — Core Web Vitals, render-blocking resources, missing alt text, heading order, page weight, and more
- **Core Web Vitals** — LCP, CLS, FCP, and TTFB measured against Google's recommended thresholds
- **AI-powered fixes** — Claude AI generates real code snippets to resolve each issue, with retry on failure
- **Score comparison** — see +/- deltas against your previous audit for the same URL
- **Grouped issues** — collapsible categories (Performance, SEO, Accessibility) with severity filtering
- **Score trends** — sparkline charts show how scores change over time per URL
- **Multi-format export** — PDF report, JSON data, or clipboard copy
- **Extension badge** — color-coded average score displayed on the extension icon
- **Audit history** — click any past audit to view full details and issues

## For Freelancers

The Client Report feature generates a professional PDF audit report with score cards, Core Web Vitals, page stats, and grouped issues. Send it directly to prospects or existing clients — show them exactly what's wrong with their site and how you'd fix it.

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
3. Hit **Run Audit** — watch the scanning animation and scores appear
4. Review the **Core Web Vitals** strip (LCP, CLS, FCP, TTFB)
5. Browse issues grouped by category, filter by severity
6. Click **Get AI Fix Suggestions** for code-level fixes
7. Export as PDF, JSON, or copy to clipboard

## Audit Categories

### Performance (20+ checks)
DOM size & depth, script count, render-blocking resources, third-party scripts, image optimization, page load timing, DOMContentLoaded, resource size, service worker detection, **LCP**, **CLS**, **FCP**, **TTFB**

### SEO (15+ checks)
Title & meta description length, H1 presence, heading hierarchy, canonical URL, Open Graph, Twitter Cards, structured data (JSON-LD), favicon, HTTPS, robots meta, charset, social meta tags

### Accessibility (12+ checks)
`lang` attribute, image alt text, link text, empty links, viewport meta, form labels, button text, skip navigation, tabindex issues, `aria-hidden` on focusable elements, duplicate IDs, heading order

## Tech Stack

- **Chrome Extension** — Manifest V3
- **Frontend** — React 19 + TypeScript + Tailwind CSS
- **AI** — Claude API (Sonnet) for fix suggestions
- **PDF** — jsPDF for styled client reports
- **Build** — Vite with custom MV3 compliance plugin
- **Testing** — Vitest (40 tests covering all scoring rules)

## Development

```bash
npm install
npm run dev     # Dev server for popup UI
npm run build   # Production build for extension
npm test        # Run test suite
```

## Contributing

Contributions welcome! Open an issue or submit a PR.

## License

[MIT](LICENSE) — Built with care by [Alkhabaz-Dev](https://github.com/Ialkyyyy)
