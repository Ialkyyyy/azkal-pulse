import React, { useState } from "react";
import { ScoreCard } from "./components/ScoreCard";
import { AuditResult } from "./components/AuditResult";
import { FixSuggestion } from "./components/FixSuggestion";
import { ReportExport } from "./components/ReportExport";
import { runAudit, AuditData } from "../utils/scoring";
import { getAIFixes, AIFix } from "../ai/claude";
import { getHistory, saveToHistory } from "../utils/storage";

export function Popup() {
  const [auditing, setAuditing] = useState(false);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [fixes, setFixes] = useState<AIFix[]>([]);
  const [loadingFixes, setLoadingFixes] = useState(false);
  const [activeTab, setActiveTab] = useState<"audit" | "history">("audit");
  const [history, setHistory] = useState<AuditData[]>([]);

  const handleAudit = async () => {
    setAuditing(true);
    setFixes([]);
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab.id || !tab.url) return;

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: analyzeCurrentPage,
      });

      const pageData = results[0]?.result;
      if (!pageData) return;

      const audit = runAudit(pageData, tab.url);
      setAuditData(audit);
      await saveToHistory(audit);
    } catch (err) {
      console.error("Audit failed:", err);
    } finally {
      setAuditing(false);
    }
  };

  const handleGetFixes = async () => {
    if (!auditData) return;
    setLoadingFixes(true);
    try {
      const aiFixes = await getAIFixes(auditData);
      setFixes(aiFixes);
    } catch (err) {
      console.error("AI fix generation failed:", err);
    } finally {
      setLoadingFixes(false);
    }
  };

  const handleShowHistory = async () => {
    const h = await getHistory();
    setHistory(h);
    setActiveTab("history");
  };

  return (
    <div className="bg-gray-950 text-white min-h-[500px] p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-cyan-400">azkal-pulse</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("audit")}
            className={`text-xs px-2 py-1 rounded ${
              activeTab === "audit"
                ? "bg-cyan-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Audit
          </button>
          <button
            onClick={handleShowHistory}
            className={`text-xs px-2 py-1 rounded ${
              activeTab === "history"
                ? "bg-cyan-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            History
          </button>
        </div>
      </header>

      {activeTab === "audit" && (
        <>
          <button
            onClick={handleAudit}
            disabled={auditing}
            className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors mb-4"
          >
            {auditing ? "Auditing..." : "Run Audit"}
          </button>

          {auditData && (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <ScoreCard
                  label="Performance"
                  score={auditData.scores.performance}
                />
                <ScoreCard label="SEO" score={auditData.scores.seo} />
                <ScoreCard
                  label="Accessibility"
                  score={auditData.scores.accessibility}
                />
              </div>

              <AuditResult data={auditData} />

              <button
                onClick={handleGetFixes}
                disabled={loadingFixes}
                className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors mt-3 mb-3"
              >
                {loadingFixes ? "Getting AI Fixes..." : "Get AI Fix Suggestions"}
              </button>

              {fixes.length > 0 && (
                <div className="space-y-2 mb-3">
                  {fixes.map((fix, i) => (
                    <FixSuggestion key={i} fix={fix} />
                  ))}
                </div>
              )}

              <ReportExport data={auditData} />
            </>
          )}
        </>
      )}

      {activeTab === "history" && (
        <div className="space-y-2">
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm text-center mt-8">
              No audit history yet
            </p>
          ) : (
            history.map((item, i) => (
              <div
                key={i}
                className="bg-gray-900 rounded-lg p-3 text-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="text-cyan-400 truncate max-w-[200px]">
                    {item.url}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-3 mt-1 text-xs">
                  <span>Perf: {item.scores.performance}</span>
                  <span>SEO: {item.scores.seo}</span>
                  <span>A11y: {item.scores.accessibility}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function analyzeCurrentPage() {
  const images = document.querySelectorAll("img");
  const links = document.querySelectorAll("a");
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");

  return {
    title: document.title,
    metaDescription:
      document.querySelector('meta[name="description"]')?.getAttribute("content") ||
      "",
    metaViewport: !!document.querySelector('meta[name="viewport"]'),
    charset: !!document.querySelector("meta[charset]"),
    lang: document.documentElement.lang || "",
    imageCount: images.length,
    imagesWithoutAlt: Array.from(images).filter((img) => !img.alt).length,
    linkCount: links.length,
    linksWithoutText: Array.from(links).filter(
      (a) => !a.textContent?.trim() && !a.getAttribute("aria-label")
    ).length,
    headingCount: headings.length,
    hasH1: !!document.querySelector("h1"),
    h1Count: document.querySelectorAll("h1").length,
    scriptCount: document.querySelectorAll("script").length,
    stylesheetCount: document.querySelectorAll('link[rel="stylesheet"]').length,
    totalDomNodes: document.querySelectorAll("*").length,
    hasCanonical: !!document.querySelector('link[rel="canonical"]'),
    hasRobotsMeta: !!document.querySelector('meta[name="robots"]'),
    hasOpenGraph: !!document.querySelector('meta[property="og:title"]'),
    formInputsWithoutLabel: Array.from(
      document.querySelectorAll("input, select, textarea")
    ).filter(
      (el) =>
        !el.getAttribute("aria-label") &&
        !el.id &&
        !document.querySelector(`label[for="${el.id}"]`)
    ).length,
    colorContrast: null,
  };
}
