# azkal-pulse

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Chrome extension that audits any webpage for performance, SEO, and accessibility — then uses Claude AI to generate actual code fixes you can copy and paste. Lighthouse tells you what's wrong. This tells you how to fix it.

## Features

**40+ checks** — DOM size, script count, render-blocking resources, image optimization, missing alt text, heading hierarchy, meta tags, structured data, form labels, and more. Each check has a severity level (high, medium, low) and specific context about what it found.

**Core Web Vitals** — measures LCP, CLS, FCP, and TTFB against Google's recommended thresholds. Results show up in a strip right below the scores.

**AI-powered fixes** — hit "Get AI Fix Suggestions" and Claude generates 3–6 code snippets targeting the highest-impact issues. If the AI response is malformed, it retries automatically.

**Score comparison** — run an audit on a page you've audited before and see the +/- delta. Sparkline charts in the history tab show score trends over time.

**Grouped issues** — issues are organized into collapsible Performance, SEO, and Accessibility sections. Filter by severity to focus on what matters.

**Multi-format export** — download a styled PDF report (dark theme with score cards, Web Vitals, and grouped issues), export raw JSON, or copy a text summary to clipboard. The PDF is client-ready — send it to prospects to show them what's wrong with their site.

**Extension badge** — the icon shows a color-coded average score. Green for 90+, yellow for 50+, red below that.

## Installation

```bash
git clone https://github.com/Ialkyyyy/azkal-pulse.git
cd azkal-pulse
npm install
npm run build
```

Then in Chrome: go to `chrome://extensions/`, enable Developer mode, click "Load unpacked", and select the `dist` folder.

To use AI fixes, open the Settings tab in the extension and paste your Anthropic API key. Get one at [console.anthropic.com](https://console.anthropic.com).

## Development

```bash
npm run dev     # Dev server for popup UI
npm run build   # Production build for extension
npm test        # 40 tests covering all scoring rules
```

## Tech stack

Chrome Extension (Manifest V3), React 19, TypeScript, Tailwind CSS, Claude API for fix suggestions, jsPDF for reports, Vite with a custom plugin to strip jsPDF's CDN reference for MV3 compliance. 40 Vitest tests.

## Part of the azkal lineup

azkal-pulse is one of four developer tools in the azkal series — alongside [azkal-lang](https://github.com/Ialkyyyy/azkal-lang), [azkal-ledger](https://github.com/Ialkyyyy/azkal-ledger), and [azkal-cli](https://github.com/Ialkyyyy/azkal-cli).

Check out more at [alkhabaz.dev](https://alkhabaz.dev).

## Contributing

PRs and issues are welcome. Fork it, make your changes, open a pull request.

## License

MIT
