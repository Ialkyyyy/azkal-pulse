import { AuditData } from "../utils/scoring";

export async function generatePDFReport(data: AuditData): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Header ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 50, "F");
  doc.setTextColor(103, 232, 249);
  doc.setFontSize(24);
  doc.text("azkal-pulse", 20, 22);
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text("Site Audit Report", 20, 31);
  doc.setFontSize(9);
  doc.text(new Date(data.timestamp).toLocaleString(), 20, 38);
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(10);
  doc.text(data.url, 20, 46);

  let y = 62;

  // ── Scores ──
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.text("Scores", 20, y);
  y += 4;

  const scores = [
    { label: "Performance", score: data.scores.performance },
    { label: "SEO", score: data.scores.seo },
    { label: "Accessibility", score: data.scores.accessibility },
  ];

  // Score boxes
  const boxW = 50;
  const gap = 10;
  const startX = 20;
  scores.forEach((s, i) => {
    const x = startX + i * (boxW + gap);
    const color = getScoreColor(s.score);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, y, boxW, 28, 3, 3, "F");
    doc.setFontSize(22);
    doc.setTextColor(color.r, color.g, color.b);
    doc.text(String(s.score), x + boxW / 2, y + 14, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(s.label, x + boxW / 2, y + 23, { align: "center" });
  });

  y += 38;

  // ── Web Vitals ──
  const vitals = [
    { label: "LCP", value: data.pageData.lcp, format: (v: number) => `${(v / 1000).toFixed(1)}s`, good: 2500, poor: 4000 },
    { label: "CLS", value: data.pageData.cls, format: (v: number) => v.toFixed(3), good: 0.1, poor: 0.25 },
    { label: "FCP", value: data.pageData.fcp, format: (v: number) => `${(v / 1000).toFixed(1)}s`, good: 1800, poor: 3000 },
    { label: "TTFB", value: data.pageData.ttfb, format: (v: number) => `${(v / 1000).toFixed(2)}s`, good: 800, poor: 1800 },
  ];

  const hasVitals = vitals.some((v) => v.value !== null);
  if (hasVitals) {
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(16);
    doc.text("Core Web Vitals", 20, y);
    y += 4;

    const vBoxW = 38;
    const vGap = 5;
    vitals.forEach((v, i) => {
      const x = startX + i * (vBoxW + vGap);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(x, y, vBoxW, 22, 2, 2, "F");

      if (v.value !== null) {
        const color = v.value <= v.good ? { r: 34, g: 197, b: 94 } : v.value <= v.poor ? { r: 234, g: 179, b: 8 } : { r: 239, g: 68, b: 68 };
        doc.setFontSize(12);
        doc.setTextColor(color.r, color.g, color.b);
        doc.text(v.format(v.value), x + vBoxW / 2, y + 10, { align: "center" });
      } else {
        doc.setFontSize(12);
        doc.setTextColor(180, 180, 180);
        doc.text("--", x + vBoxW / 2, y + 10, { align: "center" });
      }

      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(v.label, x + vBoxW / 2, y + 18, { align: "center" });
    });

    y += 32;
  }

  // ── Page Stats ──
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.text("Page Stats", 20, y);
  y += 10;

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  const stats = [
    `DOM Nodes: ${data.pageData.totalDomNodes.toLocaleString()}`,
    `Network Requests: ${data.pageData.resourceCount}`,
    `Page Size: ${(data.pageData.totalResourceSize / 1_000_000).toFixed(2)} MB`,
    `Page Load: ${(data.pageData.pageLoadTime / 1000).toFixed(1)}s`,
    `DOM Ready: ${(data.pageData.domContentLoaded / 1000).toFixed(1)}s`,
    `Scripts: ${data.pageData.scriptCount}  |  Stylesheets: ${data.pageData.stylesheetCount}`,
  ];
  for (const stat of stats) {
    doc.text(stat, 20, y);
    y += 6;
  }

  y += 6;

  // ── Issues ──
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.text(`Issues (${data.issues.length})`, 20, y);
  y += 10;

  const categories = ["performance", "seo", "accessibility"] as const;
  const categoryLabels = { performance: "Performance", seo: "SEO", accessibility: "Accessibility" };

  for (const cat of categories) {
    const catIssues = data.issues.filter((i) => i.category === cat);
    if (catIssues.length === 0) continue;

    if (y > 260) { doc.addPage(); y = 20; }

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`${categoryLabels[cat]} (${catIssues.length})`, 20, y);
    y += 7;

    doc.setFontSize(9);
    for (const issue of catIssues) {
      if (y > 275) { doc.addPage(); y = 20; }

      const sevColor =
        issue.severity === "high" ? { r: 239, g: 68, b: 68 }
        : issue.severity === "medium" ? { r: 234, g: 179, b: 8 }
        : { r: 59, g: 130, b: 246 };

      doc.setFillColor(sevColor.r, sevColor.g, sevColor.b);
      doc.circle(24, y - 1.5, 1.5, "F");
      doc.setTextColor(60, 60, 60);

      // Wrap long messages
      const maxWidth = pageWidth - 50;
      const lines = doc.splitTextToSize(issue.message, maxWidth);
      doc.text(lines, 30, y);
      y += lines.length * 5 + 2;
    }

    y += 4;
  }

  // ── Footer ──
  y = Math.max(y + 10, 270);
  if (y > 280) { doc.addPage(); y = 270; }
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, pageWidth - 20, y);
  y += 6;
  doc.setTextColor(140, 140, 140);
  doc.setFontSize(8);
  doc.text("Generated by azkal-pulse — https://github.com/Ialkyyyy/azkal-pulse", 20, y);

  doc.save(`audit-report-${new Date(data.timestamp).toISOString().split("T")[0]}.pdf`);
}

function getScoreColor(score: number) {
  if (score >= 90) return { r: 34, g: 197, b: 94 };
  if (score >= 50) return { r: 234, g: 179, b: 8 };
  return { r: 239, g: 68, b: 68 };
}
