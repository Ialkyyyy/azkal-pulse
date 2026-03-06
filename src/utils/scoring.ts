export interface PageData {
  title: string;
  titleLength: number;
  metaDescription: string;
  metaDescriptionLength: number;
  metaViewport: boolean;
  charset: boolean;
  lang: string;
  imageCount: number;
  imagesWithoutAlt: number;
  imagesWithoutDimensions: number;
  largeImageCount: number;
  linkCount: number;
  externalLinkCount: number;
  linksWithoutText: number;
  headingCount: number;
  hasH1: boolean;
  h1Count: number;
  headingOrderValid: boolean;
  scriptCount: number;
  inlineScriptCount: number;
  stylesheetCount: number;
  inlineStyleCount: number;
  totalDomNodes: number;
  maxDomDepth: number;
  hasCanonical: boolean;
  hasRobotsMeta: boolean;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  hasStructuredData: boolean;
  hasFavicon: boolean;
  isHttps: boolean;
  formInputsWithoutLabel: number;
  buttonsWithoutText: number;
  hasSkipLink: boolean;
  tabindexIssues: number;
  ariaHiddenOnFocusable: number;
  renderBlockingResources: number;
  totalResourceSize: number;
  resourceCount: number;
  pageLoadTime: number;
  domContentLoaded: number;
  thirdPartyScripts: number;
  hasServiceWorker: boolean;
  duplicateIds: number;
  emptyLinks: number;
  metaKeywords: boolean;
  hasSitemap: boolean;
  socialMetaTags: number;
}

export interface AuditIssue {
  message: string;
  category: "performance" | "seo" | "accessibility";
  severity: "high" | "medium" | "low";
}

export interface AuditData {
  url: string;
  timestamp: number;
  scores: {
    performance: number;
    seo: number;
    accessibility: number;
  };
  issues: AuditIssue[];
  pageData: PageData;
}

export function runAudit(pageData: PageData, url: string): AuditData {
  const issues: AuditIssue[] = [];
  let perfScore = 100;
  let seoScore = 100;
  let a11yScore = 100;

  // ═══════════════════════════════════
  // PERFORMANCE
  // ═══════════════════════════════════

  // DOM size
  if (pageData.totalDomNodes > 3000) {
    issues.push({ message: `Very large DOM: ${pageData.totalDomNodes.toLocaleString()} nodes (aim for <1,500)`, category: "performance", severity: "high" });
    perfScore -= 20;
  } else if (pageData.totalDomNodes > 1500) {
    issues.push({ message: `Large DOM: ${pageData.totalDomNodes.toLocaleString()} nodes (aim for <1,500)`, category: "performance", severity: "medium" });
    perfScore -= 10;
  }

  // DOM depth
  if (pageData.maxDomDepth > 15) {
    issues.push({ message: `Deep DOM nesting: ${pageData.maxDomDepth} levels (aim for <15)`, category: "performance", severity: "medium" });
    perfScore -= 8;
  }

  // Scripts
  if (pageData.scriptCount > 15) {
    issues.push({ message: `Too many scripts: ${pageData.scriptCount} (consider bundling/deferring)`, category: "performance", severity: "high" });
    perfScore -= 15;
  } else if (pageData.scriptCount > 8) {
    issues.push({ message: `Many scripts loaded: ${pageData.scriptCount} (consider bundling)`, category: "performance", severity: "medium" });
    perfScore -= 8;
  }

  // Inline scripts
  if (pageData.inlineScriptCount > 5) {
    issues.push({ message: `${pageData.inlineScriptCount} inline scripts (move to external files for caching)`, category: "performance", severity: "low" });
    perfScore -= 5;
  }

  // Stylesheets
  if (pageData.stylesheetCount > 5) {
    issues.push({ message: `${pageData.stylesheetCount} stylesheets (consolidate to reduce requests)`, category: "performance", severity: "medium" });
    perfScore -= 8;
  }

  // Inline styles
  if (pageData.inlineStyleCount > 10) {
    issues.push({ message: `${pageData.inlineStyleCount} inline style attributes (use CSS classes instead)`, category: "performance", severity: "low" });
    perfScore -= 3;
  }

  // Render-blocking resources
  if (pageData.renderBlockingResources > 3) {
    issues.push({ message: `${pageData.renderBlockingResources} render-blocking resources (defer or async non-critical scripts/styles)`, category: "performance", severity: "high" });
    perfScore -= 12;
  }

  // Third-party scripts
  if (pageData.thirdPartyScripts > 5) {
    issues.push({ message: `${pageData.thirdPartyScripts} third-party scripts detected (each adds latency)`, category: "performance", severity: "medium" });
    perfScore -= 8;
  }

  // Images without dimensions
  if (pageData.imagesWithoutDimensions > 0) {
    issues.push({ message: `${pageData.imagesWithoutDimensions} images without explicit width/height (causes layout shift)`, category: "performance", severity: "medium" });
    perfScore -= Math.min(10, pageData.imagesWithoutDimensions * 3);
  }

  // Large images
  if (pageData.largeImageCount > 0) {
    issues.push({ message: `${pageData.largeImageCount} oversized images detected (>200KB, compress or use modern formats)`, category: "performance", severity: "high" });
    perfScore -= Math.min(15, pageData.largeImageCount * 5);
  }

  // Page load timing
  if (pageData.pageLoadTime > 5000) {
    issues.push({ message: `Slow page load: ${(pageData.pageLoadTime / 1000).toFixed(1)}s (aim for <3s)`, category: "performance", severity: "high" });
    perfScore -= 15;
  } else if (pageData.pageLoadTime > 3000) {
    issues.push({ message: `Page load: ${(pageData.pageLoadTime / 1000).toFixed(1)}s (aim for <3s)`, category: "performance", severity: "medium" });
    perfScore -= 8;
  }

  // Total resources
  if (pageData.resourceCount > 80) {
    issues.push({ message: `${pageData.resourceCount} network requests (reduce to improve load time)`, category: "performance", severity: "medium" });
    perfScore -= 8;
  }

  // Service worker
  if (!pageData.hasServiceWorker && pageData.isHttps) {
    issues.push({ message: "No service worker detected (add one for offline support & faster repeat visits)", category: "performance", severity: "low" });
    perfScore -= 3;
  }

  // ═══════════════════════════════════
  // SEO
  // ═══════════════════════════════════

  // Title
  if (!pageData.title) {
    issues.push({ message: "Missing page title", category: "seo", severity: "high" });
    seoScore -= 20;
  } else if (pageData.titleLength > 60) {
    issues.push({ message: `Title too long: ${pageData.titleLength} chars (aim for 30-60)`, category: "seo", severity: "low" });
    seoScore -= 5;
  } else if (pageData.titleLength < 10) {
    issues.push({ message: `Title too short: ${pageData.titleLength} chars (aim for 30-60)`, category: "seo", severity: "medium" });
    seoScore -= 8;
  }

  // Meta description
  if (!pageData.metaDescription) {
    issues.push({ message: "Missing meta description", category: "seo", severity: "high" });
    seoScore -= 15;
  } else if (pageData.metaDescriptionLength > 160) {
    issues.push({ message: `Meta description too long: ${pageData.metaDescriptionLength} chars (aim for 120-160)`, category: "seo", severity: "low" });
    seoScore -= 3;
  } else if (pageData.metaDescriptionLength < 50) {
    issues.push({ message: `Meta description too short: ${pageData.metaDescriptionLength} chars (aim for 120-160)`, category: "seo", severity: "medium" });
    seoScore -= 5;
  }

  // H1
  if (!pageData.hasH1) {
    issues.push({ message: "Missing H1 heading", category: "seo", severity: "high" });
    seoScore -= 12;
  }
  if (pageData.h1Count > 1) {
    issues.push({ message: `Multiple H1 tags: ${pageData.h1Count} (best practice is one per page)`, category: "seo", severity: "medium" });
    seoScore -= 5;
  }

  // Heading hierarchy
  if (!pageData.headingOrderValid) {
    issues.push({ message: "Heading levels are not sequential (e.g. H1 -> H3, skipping H2)", category: "seo", severity: "medium" });
    seoScore -= 5;
  }

  // Canonical
  if (!pageData.hasCanonical) {
    issues.push({ message: "Missing canonical URL (risk of duplicate content)", category: "seo", severity: "medium" });
    seoScore -= 8;
  }

  // Open Graph
  if (!pageData.hasOpenGraph) {
    issues.push({ message: "Missing Open Graph tags (links won't preview well on social media)", category: "seo", severity: "medium" });
    seoScore -= 5;
  }

  // Twitter Card
  if (!pageData.hasTwitterCard) {
    issues.push({ message: "Missing Twitter Card meta tags", category: "seo", severity: "low" });
    seoScore -= 3;
  }

  // Structured data
  if (!pageData.hasStructuredData) {
    issues.push({ message: "No structured data (JSON-LD) found (helps search engines understand content)", category: "seo", severity: "low" });
    seoScore -= 5;
  }

  // Favicon
  if (!pageData.hasFavicon) {
    issues.push({ message: "Missing favicon", category: "seo", severity: "low" });
    seoScore -= 3;
  }

  // HTTPS
  if (!pageData.isHttps) {
    issues.push({ message: "Site not served over HTTPS (required for SEO ranking)", category: "seo", severity: "high" });
    seoScore -= 15;
  }

  // Robots meta
  if (!pageData.hasRobotsMeta) {
    issues.push({ message: "No robots meta tag found (add one to control indexing)", category: "seo", severity: "low" });
    seoScore -= 2;
  }

  // Images without alt (SEO impact too)
  if (pageData.imagesWithoutAlt > 3) {
    issues.push({ message: `${pageData.imagesWithoutAlt} images missing alt text (hurts image SEO)`, category: "seo", severity: "medium" });
    seoScore -= Math.min(10, pageData.imagesWithoutAlt * 2);
  }

  // ═══════════════════════════════════
  // ACCESSIBILITY
  // ═══════════════════════════════════

  // Language
  if (!pageData.lang) {
    issues.push({ message: "Missing lang attribute on <html> (screen readers need this)", category: "accessibility", severity: "high" });
    a11yScore -= 15;
  }

  // Images
  if (pageData.imagesWithoutAlt > 0) {
    issues.push({ message: `${pageData.imagesWithoutAlt} images missing alt text (inaccessible to screen readers)`, category: "accessibility", severity: "high" });
    a11yScore -= Math.min(20, pageData.imagesWithoutAlt * 4);
  }

  // Links
  if (pageData.linksWithoutText > 0) {
    issues.push({ message: `${pageData.linksWithoutText} links without descriptive text or aria-label`, category: "accessibility", severity: "medium" });
    a11yScore -= Math.min(15, pageData.linksWithoutText * 3);
  }

  // Empty links
  if (pageData.emptyLinks > 0) {
    issues.push({ message: `${pageData.emptyLinks} empty links (no href or content)`, category: "accessibility", severity: "medium" });
    a11yScore -= Math.min(10, pageData.emptyLinks * 3);
  }

  // Viewport
  if (!pageData.metaViewport) {
    issues.push({ message: "Missing viewport meta tag (page won't be mobile-friendly)", category: "accessibility", severity: "high" });
    a11yScore -= 12;
  }

  // Form inputs
  if (pageData.formInputsWithoutLabel > 0) {
    issues.push({ message: `${pageData.formInputsWithoutLabel} form inputs without associated labels`, category: "accessibility", severity: "high" });
    a11yScore -= Math.min(20, pageData.formInputsWithoutLabel * 5);
  }

  // Buttons
  if (pageData.buttonsWithoutText > 0) {
    issues.push({ message: `${pageData.buttonsWithoutText} buttons without accessible text`, category: "accessibility", severity: "high" });
    a11yScore -= Math.min(15, pageData.buttonsWithoutText * 4);
  }

  // Skip link
  if (!pageData.hasSkipLink) {
    issues.push({ message: "No skip navigation link found (keyboard users need this)", category: "accessibility", severity: "medium" });
    a11yScore -= 5;
  }

  // Tabindex
  if (pageData.tabindexIssues > 0) {
    issues.push({ message: `${pageData.tabindexIssues} elements with positive tabindex (disrupts natural tab order)`, category: "accessibility", severity: "medium" });
    a11yScore -= Math.min(10, pageData.tabindexIssues * 3);
  }

  // aria-hidden on focusable
  if (pageData.ariaHiddenOnFocusable > 0) {
    issues.push({ message: `${pageData.ariaHiddenOnFocusable} focusable elements hidden with aria-hidden`, category: "accessibility", severity: "high" });
    a11yScore -= Math.min(15, pageData.ariaHiddenOnFocusable * 5);
  }

  // Duplicate IDs
  if (pageData.duplicateIds > 0) {
    issues.push({ message: `${pageData.duplicateIds} duplicate IDs found (breaks label associations & ARIA)`, category: "accessibility", severity: "medium" });
    a11yScore -= Math.min(10, pageData.duplicateIds * 2);
  }

  // Heading order (a11y impact too)
  if (!pageData.headingOrderValid) {
    issues.push({ message: "Heading levels skip ranks (confusing for screen reader navigation)", category: "accessibility", severity: "medium" });
    a11yScore -= 5;
  }

  return {
    url,
    timestamp: Date.now(),
    scores: {
      performance: Math.max(0, Math.min(100, perfScore)),
      seo: Math.max(0, Math.min(100, seoScore)),
      accessibility: Math.max(0, Math.min(100, a11yScore)),
    },
    issues,
    pageData,
  };
}
