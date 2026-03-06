export interface PageData {
  title: string;
  metaDescription: string;
  metaViewport: boolean;
  charset: boolean;
  lang: string;
  imageCount: number;
  imagesWithoutAlt: number;
  linkCount: number;
  linksWithoutText: number;
  headingCount: number;
  hasH1: boolean;
  h1Count: number;
  scriptCount: number;
  stylesheetCount: number;
  totalDomNodes: number;
  hasCanonical: boolean;
  hasRobotsMeta: boolean;
  hasOpenGraph: boolean;
  formInputsWithoutLabel: number;
  colorContrast: null;
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

  // Performance checks
  if (pageData.totalDomNodes > 1500) {
    issues.push({
      message: `Excessive DOM size: ${pageData.totalDomNodes} nodes (aim for <1500)`,
      category: "performance",
      severity: "high",
    });
    perfScore -= 15;
  }
  if (pageData.scriptCount > 10) {
    issues.push({
      message: `Too many scripts: ${pageData.scriptCount} (consider bundling)`,
      category: "performance",
      severity: "medium",
    });
    perfScore -= 10;
  }
  if (pageData.stylesheetCount > 5) {
    issues.push({
      message: `Multiple stylesheets: ${pageData.stylesheetCount} (consider consolidating)`,
      category: "performance",
      severity: "low",
    });
    perfScore -= 5;
  }

  // SEO checks
  if (!pageData.title) {
    issues.push({
      message: "Missing page title",
      category: "seo",
      severity: "high",
    });
    seoScore -= 20;
  } else if (pageData.title.length > 60) {
    issues.push({
      message: `Title too long: ${pageData.title.length} chars (aim for <60)`,
      category: "seo",
      severity: "low",
    });
    seoScore -= 5;
  }
  if (!pageData.metaDescription) {
    issues.push({
      message: "Missing meta description",
      category: "seo",
      severity: "high",
    });
    seoScore -= 15;
  }
  if (!pageData.hasH1) {
    issues.push({
      message: "Missing H1 heading",
      category: "seo",
      severity: "medium",
    });
    seoScore -= 10;
  }
  if (pageData.h1Count > 1) {
    issues.push({
      message: `Multiple H1 tags: ${pageData.h1Count} (use only one)`,
      category: "seo",
      severity: "medium",
    });
    seoScore -= 5;
  }
  if (!pageData.hasCanonical) {
    issues.push({
      message: "Missing canonical URL",
      category: "seo",
      severity: "medium",
    });
    seoScore -= 10;
  }
  if (!pageData.hasOpenGraph) {
    issues.push({
      message: "Missing Open Graph meta tags",
      category: "seo",
      severity: "low",
    });
    seoScore -= 5;
  }

  // Accessibility checks
  if (!pageData.lang) {
    issues.push({
      message: "Missing lang attribute on <html>",
      category: "accessibility",
      severity: "high",
    });
    a11yScore -= 15;
  }
  if (pageData.imagesWithoutAlt > 0) {
    issues.push({
      message: `${pageData.imagesWithoutAlt} images missing alt text`,
      category: "accessibility",
      severity: "high",
    });
    a11yScore -= Math.min(20, pageData.imagesWithoutAlt * 5);
  }
  if (pageData.linksWithoutText > 0) {
    issues.push({
      message: `${pageData.linksWithoutText} links without descriptive text`,
      category: "accessibility",
      severity: "medium",
    });
    a11yScore -= Math.min(15, pageData.linksWithoutText * 3);
  }
  if (!pageData.metaViewport) {
    issues.push({
      message: "Missing viewport meta tag",
      category: "accessibility",
      severity: "medium",
    });
    a11yScore -= 10;
  }
  if (pageData.formInputsWithoutLabel > 0) {
    issues.push({
      message: `${pageData.formInputsWithoutLabel} form inputs without labels`,
      category: "accessibility",
      severity: "high",
    });
    a11yScore -= Math.min(20, pageData.formInputsWithoutLabel * 5);
  }

  return {
    url,
    timestamp: Date.now(),
    scores: {
      performance: Math.max(0, perfScore),
      seo: Math.max(0, seoScore),
      accessibility: Math.max(0, a11yScore),
    },
    issues,
    pageData,
  };
}
