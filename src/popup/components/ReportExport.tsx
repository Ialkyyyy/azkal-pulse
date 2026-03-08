import React, { useState } from "react";
import { AuditData } from "../../utils/scoring";
import { generatePDFReport } from "../../reports/pdf-generator";

interface Props {
  data: AuditData;
}

export function ReportExport({ data }: Props) {
  const [generating, setGenerating] = useState(false);

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

  return (
    <button
      onClick={handleExport}
      disabled={generating}
      className="w-full py-2 px-4 border border-gray-700 hover:border-cyan-600 text-gray-300 hover:text-cyan-400 rounded-lg text-sm transition-colors"
    >
      {generating ? "Generating PDF..." : "Export Client Report (PDF)"}
    </button>
  );
}
