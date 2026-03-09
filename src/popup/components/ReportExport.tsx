import React, { useState } from "react";
import { AuditData } from "../../utils/scoring";
import { generatePDFReport } from "../../reports/pdf-generator";

interface Props {
  data: AuditData;
}

function buildSummary(data: AuditData): string {
  const lines = [
    `azkal-pulse Audit Report`,
    `URL: ${data.url}`,
    `Date: ${new Date(data.timestamp).toLocaleString()}`,
    ``,
    `Scores:`,
    `  Performance:   ${data.scores.performance}/100`,
    `  SEO:           ${data.scores.seo}/100`,
    `  Accessibility: ${data.scores.accessibility}/100`,
    ``,
    `Issues (${data.issues.length}):`,
    ...data.issues.map((i) => `  [${i.severity}] ${i.message}`),
  ];
  return lines.join("\n");
}

export function ReportExport({ data }: Props) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    setGenerating(true);
    try {
      await generatePDFReport(data);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildSummary(data));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        disabled={generating}
        className="flex-1 py-2 px-4 border border-gray-700 hover:border-cyan-600 text-gray-300 hover:text-cyan-400 rounded-lg text-sm transition-colors"
      >
        {generating ? "Generating PDF..." : "Export PDF"}
      </button>
      <button
        onClick={handleCopy}
        className="py-2 px-3 border border-gray-700 hover:border-cyan-600 text-gray-300 hover:text-cyan-400 rounded-lg text-sm transition-colors"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
