import { describe, it, expect } from "vitest";
import { runAudit, PageData } from "./scoring";

function makePageData(overrides: Partial<PageData> = {}): PageData {
  return {
    title: "Test Page Title for Testing",
    titleLength: 30,
    metaDescription: "A sufficient meta description that is long enough to pass the check.",
    metaDescriptionLength: 70,
    metaViewport: true,
    charset: true,
    lang: "en",
    imageCount: 2,
    imagesWithoutAlt: 0,
    imagesWithoutDimensions: 0,
    largeImageCount: 0,
    linkCount: 5,
    externalLinkCount: 1,
    linksWithoutText: 0,
    headingCount: 3,
    hasH1: true,
    h1Count: 1,
    headingOrderValid: true,
    scriptCount: 3,
    inlineScriptCount: 0,
    stylesheetCount: 1,
    inlineStyleCount: 0,
    totalDomNodes: 500,
    maxDomDepth: 8,
    hasCanonical: true,
    hasRobotsMeta: true,
    hasOpenGraph: true,
    hasTwitterCard: true,
    hasStructuredData: true,
    hasFavicon: true,
    isHttps: true,
    formInputsWithoutLabel: 0,
    buttonsWithoutText: 0,
    hasSkipLink: true,
    tabindexIssues: 0,
    ariaHiddenOnFocusable: 0,
    renderBlockingResources: 1,
    totalResourceSize: 500_000,
    resourceCount: 20,
    pageLoadTime: 1500,
    domContentLoaded: 800,
    thirdPartyScripts: 1,
    hasServiceWorker: true,
    duplicateIds: 0,
    emptyLinks: 0,
    metaKeywords: false,
    hasSitemap: false,
    socialMetaTags: 4,
    lcp: 1200,
    cls: 0.05,
    fcp: 900,
    ttfb: 200,
    ...overrides,
  };
}

describe("runAudit", () => {
  it("returns perfect scores for an ideal page", () => {
    const result = runAudit(makePageData(), "https://example.com");
    expect(result.scores.performance).toBe(100);
    expect(result.scores.seo).toBe(100);
    expect(result.scores.accessibility).toBe(100);
    expect(result.issues).toHaveLength(0);
    expect(result.url).toBe("https://example.com");
  });

  it("clamps scores to 0-100", () => {
    const terrible = makePageData({
      totalDomNodes: 5000,
      maxDomDepth: 30,
      scriptCount: 20,
      inlineScriptCount: 10,
      stylesheetCount: 10,
      inlineStyleCount: 20,
      renderBlockingResources: 10,
      thirdPartyScripts: 10,
      imagesWithoutDimensions: 10,
      largeImageCount: 10,
      pageLoadTime: 10000,
      resourceCount: 100,
      domContentLoaded: 5000,
      totalResourceSize: 10_000_000,
      hasServiceWorker: false,
      lcp: 8000,
      cls: 0.5,
      fcp: 5000,
      ttfb: 3000,
    });
    const result = runAudit(terrible, "https://example.com");
    expect(result.scores.performance).toBe(0);
  });

  // ── Performance checks ──

  it("flags very large DOM", () => {
    const result = runAudit(makePageData({ totalDomNodes: 4000 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("Very large DOM"))).toBe(true);
    expect(result.scores.performance).toBe(80);
  });

  it("flags large DOM", () => {
    const result = runAudit(makePageData({ totalDomNodes: 2000 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("Large DOM"))).toBe(true);
    expect(result.scores.performance).toBe(90);
  });

  it("flags deep DOM nesting", () => {
    const result = runAudit(makePageData({ maxDomDepth: 20 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("Deep DOM nesting"))).toBe(true);
  });

  it("flags too many scripts", () => {
    const result = runAudit(makePageData({ scriptCount: 20 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("Too many scripts"))).toBe(true);
  });

  it("flags many scripts", () => {
    const result = runAudit(makePageData({ scriptCount: 10 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("Many scripts loaded"))).toBe(true);
  });

  it("flags render-blocking resources", () => {
    const result = runAudit(makePageData({ renderBlockingResources: 5 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("render-blocking"))).toBe(true);
  });

  it("flags slow page load", () => {
    const result = runAudit(makePageData({ pageLoadTime: 6000 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("Slow page load"))).toBe(true);
  });

  it("flags heavy page size", () => {
    const result = runAudit(makePageData({ totalResourceSize: 6_000_000 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("Heavy page"))).toBe(true);
  });

  it("flags missing service worker on HTTPS", () => {
    const result = runAudit(makePageData({ hasServiceWorker: false, isHttps: true }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("service worker"))).toBe(true);
  });

  it("does not flag missing service worker on HTTP", () => {
    const result = runAudit(makePageData({ hasServiceWorker: false, isHttps: false }), "http://x.com");
    expect(result.issues.some((i) => i.message.includes("service worker"))).toBe(false);
  });

  // ── Web Vitals ──

  it("flags poor LCP", () => {
    const result = runAudit(makePageData({ lcp: 5000 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("Poor LCP"))).toBe(true);
  });

  it("flags LCP needing improvement", () => {
    const result = runAudit(makePageData({ lcp: 3000 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("LCP needs improvement"))).toBe(true);
  });

  it("does not flag good LCP", () => {
    const result = runAudit(makePageData({ lcp: 1500 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("LCP"))).toBe(false);
  });

  it("flags poor CLS", () => {
    const result = runAudit(makePageData({ cls: 0.3 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("Poor CLS"))).toBe(true);
  });

  it("flags CLS needing improvement", () => {
    const result = runAudit(makePageData({ cls: 0.15 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("CLS needs improvement"))).toBe(true);
  });

  it("flags poor FCP", () => {
    const result = runAudit(makePageData({ fcp: 4000 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("Poor FCP"))).toBe(true);
  });

  it("flags poor TTFB", () => {
    const result = runAudit(makePageData({ ttfb: 2000 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("Poor TTFB"))).toBe(true);
  });

  it("handles null Web Vitals gracefully", () => {
    const result = runAudit(makePageData({ lcp: null, cls: null, fcp: null, ttfb: null }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("LCP"))).toBe(false);
    expect(result.issues.some((i) => i.message.includes("CLS"))).toBe(false);
  });

  // ── SEO checks ──

  it("flags missing title", () => {
    const result = runAudit(makePageData({ title: "", titleLength: 0 }), "https://x.com");
    expect(result.issues.some((i) => i.message === "Missing page title")).toBe(true);
  });

  it("flags long title", () => {
    const result = runAudit(makePageData({ titleLength: 80 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("Title too long"))).toBe(true);
  });

  it("flags short title", () => {
    const result = runAudit(makePageData({ titleLength: 5 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("Title too short"))).toBe(true);
  });

  it("flags missing meta description", () => {
    const result = runAudit(makePageData({ metaDescription: "", metaDescriptionLength: 0 }), "https://x.com");
    expect(result.issues.some((i) => i.message === "Missing meta description")).toBe(true);
  });

  it("flags missing H1", () => {
    const result = runAudit(makePageData({ hasH1: false }), "https://x.com");
    expect(result.issues.some((i) => i.message === "Missing H1 heading")).toBe(true);
  });

  it("flags multiple H1s", () => {
    const result = runAudit(makePageData({ h1Count: 3 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("Multiple H1 tags"))).toBe(true);
  });

  it("flags missing canonical", () => {
    const result = runAudit(makePageData({ hasCanonical: false }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("canonical"))).toBe(true);
  });

  it("flags HTTP site", () => {
    const result = runAudit(makePageData({ isHttps: false, hasServiceWorker: false }), "http://x.com");
    expect(result.issues.some((i) => i.message.includes("HTTPS"))).toBe(true);
  });

  it("flags missing charset", () => {
    const result = runAudit(makePageData({ charset: false }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("charset"))).toBe(true);
  });

  // ── Accessibility checks ──

  it("flags missing lang", () => {
    const result = runAudit(makePageData({ lang: "" }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("lang attribute"))).toBe(true);
  });

  it("flags images without alt", () => {
    const result = runAudit(makePageData({ imagesWithoutAlt: 5 }), "https://x.com");
    const a11yIssue = result.issues.find((i) => i.category === "accessibility" && i.message.includes("alt text"));
    expect(a11yIssue).toBeDefined();
    expect(a11yIssue!.severity).toBe("high");
  });

  it("flags missing viewport", () => {
    const result = runAudit(makePageData({ metaViewport: false }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("viewport"))).toBe(true);
  });

  it("flags form inputs without labels", () => {
    const result = runAudit(makePageData({ formInputsWithoutLabel: 3 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("form inputs without"))).toBe(true);
  });

  it("flags buttons without text", () => {
    const result = runAudit(makePageData({ buttonsWithoutText: 2 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("buttons without"))).toBe(true);
  });

  it("flags missing skip link", () => {
    const result = runAudit(makePageData({ hasSkipLink: false }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("skip navigation"))).toBe(true);
  });

  it("flags duplicate IDs", () => {
    const result = runAudit(makePageData({ duplicateIds: 4 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("duplicate IDs"))).toBe(true);
  });

  it("flags aria-hidden on focusable", () => {
    const result = runAudit(makePageData({ ariaHiddenOnFocusable: 2 }), "https://x.com");
    expect(result.issues.some((i) => i.message.includes("aria-hidden"))).toBe(true);
  });

  it("flags heading order issues in both seo and a11y", () => {
    const result = runAudit(makePageData({ headingOrderValid: false }), "https://x.com");
    const seo = result.issues.filter((i) => i.category === "seo" && i.message.includes("Heading levels"));
    const a11y = result.issues.filter((i) => i.category === "accessibility" && i.message.includes("Heading levels"));
    expect(seo.length).toBe(1);
    expect(a11y.length).toBe(1);
  });

  it("includes timestamp and url in result", () => {
    const before = Date.now();
    const result = runAudit(makePageData(), "https://test.dev");
    expect(result.url).toBe("https://test.dev");
    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it("attaches pageData to result", () => {
    const pd = makePageData({ totalDomNodes: 999 });
    const result = runAudit(pd, "https://x.com");
    expect(result.pageData.totalDomNodes).toBe(999);
  });
});
