import React, { useState, useEffect } from "react";
import { ScoreCard } from "./components/ScoreCard";
import { AuditResult } from "./components/AuditResult";
import { FixSuggestion } from "./components/FixSuggestion";
import { ReportExport } from "./components/ReportExport";
import { runAudit, AuditData } from "../utils/scoring";
import { getAIFixes, AIFix } from "../ai/claude";
import { getHistory, saveToHistory, clearHistory, getPreviousAudit } from "../utils/storage";

type ScanPhase = "idle" | "connecting" | "analyzing-dom" | "scoring" | "done";

const PHASE_LABELS: Record<ScanPhase, string> = {
  idle: "",
  connecting: "Connecting to page...",
  "analyzing-dom": "Analyzing page...",
  scoring: "Calculating scores...",
  done: "Audit complete",
};

export function Popup() {
  const [scanPhase, setScanPhase] = useState<ScanPhase>("idle");
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [fixes, setFixes] = useState<AIFix[]>([]);
  const [loadingFixes, setLoadingFixes] = useState(false);
  const [fixError, setFixError] = useState("");
  const [activeTab, setActiveTab] = useState<"audit" | "history" | "settings">("audit");
  const [history, setHistory] = useState<AuditData[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [prevAudit, setPrevAudit] = useState<AuditData | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<AuditData | null>(null);

  useEffect(() => {
    chrome.storage.local.get("anthropic_api_key", (result) => {
      if (result.anthropic_api_key) {
        setApiKey(result.anthropic_api_key);
      }
    });
  }, []);
  const [revealedScores, setRevealedScores] = useState<{
    performance: number | null;
    seo: number | null;
    accessibility: number | null;
  }>({ performance: null, seo: null, accessibility: null });

  const auditing = scanPhase !== "idle" && scanPhase !== "done";

  const animateScore = (target: number, key: "performance" | "seo" | "accessibility") => {
    let current = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setRevealedScores((prev) => ({ ...prev, [key]: current }));
      if (current >= target) clearInterval(interval);
    }, 20);
  };

  const [auditError, setAuditError] = useState("");

  const handleAudit = async () => {
    setAuditData(null);
    setFixes([]);
    setAuditError("");
    setRevealedScores({ performance: null, seo: null, accessibility: null });

    try {
      setScanPhase("connecting");
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id || !tab.url) { setScanPhase("idle"); return; }

      // Can't audit internal browser pages
      if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://") || tab.url.startsWith("about:")) {
        setAuditError("Can't audit internal browser pages. Navigate to a website first.");
        setScanPhase("idle");
        return;
      }

      setScanPhase("analyzing-dom");
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: analyzeCurrentPage,
      });
      const pageData = results[0]?.result;
      if (!pageData) {
        setAuditError("Failed to analyze page. The page may have blocked script injection.");
        setScanPhase("idle");
        return;
      }

      setScanPhase("scoring");
      const audit = runAudit(pageData, tab.url);

      setAuditData(audit);
      setScanPhase("done");

      setTimeout(() => animateScore(audit.scores.performance, "performance"), 100);
      setTimeout(() => animateScore(audit.scores.seo, "seo"), 400);
      setTimeout(() => animateScore(audit.scores.accessibility, "accessibility"), 700);

      await saveToHistory(audit);
      const prev = await getPreviousAudit(tab.url);
      setPrevAudit(prev);
    } catch (err) {
      console.error("Audit failed:", err);
      setAuditError(err instanceof Error ? err.message : "Audit failed unexpectedly.");
      setScanPhase("idle");
    }
  };

  const handleGetFixes = async () => {
    if (!auditData) return;
    setLoadingFixes(true);
    setFixError("");
    try {
      const aiFixes = await getAIFixes(auditData);
      setFixes(aiFixes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI fix generation failed";
      setFixError(msg);
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

  const progressPercent =
    scanPhase === "idle" ? 0 :
    scanPhase === "connecting" ? 15 :
    scanPhase === "analyzing-dom" ? 50 :
    scanPhase === "scoring" ? 90 : 100;

  return (
    <div className="bg-gray-950 text-white min-h-[500px] p-4">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-cyan-400">azkal-pulse</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("audit")}
            className={`text-xs px-2 py-1 rounded ${
              activeTab === "audit" ? "bg-cyan-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Audit
          </button>
          <button
            onClick={handleShowHistory}
            className={`text-xs px-2 py-1 rounded ${
              activeTab === "history" ? "bg-cyan-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`text-xs px-2 py-1 rounded ${
              activeTab === "settings" ? "bg-cyan-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Settings
          </button>
        </div>
      </header>

      {activeTab === "audit" && (
        <>
          <button
            onClick={handleAudit}
            disabled={auditing}
            className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed rounded-lg font-medium transition-colors mb-4"
          >
            {auditing ? "Scanning..." : scanPhase === "done" ? "Re-run Audit" : "Run Audit"}
          </button>

          {auditError && (
            <p className="text-xs text-red-400 mb-3">{auditError}</p>
          )}

          {/* Scanning animation */}
          {auditing && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-xs text-cyan-300">{PHASE_LABELS[scanPhase]}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-3 space-y-1.5">
                {scanPhase !== "connecting" && (
                  <ScanStep label="Page connected" done />
                )}
                {scanPhase === "scoring" && (
                  <ScanStep label="Page analyzed" done />
                )}
              </div>
            </div>
          )}

          {auditData && scanPhase === "done" && (
            <>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <ScoreCard label="Performance" score={revealedScores.performance} delta={prevAudit ? auditData.scores.performance - prevAudit.scores.performance : undefined} />
                <ScoreCard label="SEO" score={revealedScores.seo} delta={prevAudit ? auditData.scores.seo - prevAudit.scores.seo : undefined} />
                <ScoreCard label="Accessibility" score={revealedScores.accessibility} delta={prevAudit ? auditData.scores.accessibility - prevAudit.scores.accessibility : undefined} />
              </div>

              {/* Web Vitals strip */}
              {(auditData.pageData.lcp !== null || auditData.pageData.cls !== null || auditData.pageData.fcp !== null || auditData.pageData.ttfb !== null) && (
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  <VitalPill label="LCP" value={auditData.pageData.lcp} unit="s" format={(v) => (v / 1000).toFixed(1)} good={2500} poor={4000} />
                  <VitalPill label="CLS" value={auditData.pageData.cls} unit="" format={(v) => v.toFixed(3)} good={0.1} poor={0.25} />
                  <VitalPill label="FCP" value={auditData.pageData.fcp} unit="s" format={(v) => (v / 1000).toFixed(1)} good={1800} poor={3000} />
                  <VitalPill label="TTFB" value={auditData.pageData.ttfb} unit="s" format={(v) => (v / 1000).toFixed(2)} good={800} poor={1800} />
                </div>
              )}

              <div className="mb-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span>{auditData.issues.length} issues found</span>
                  <span>|</span>
                  <span>{auditData.pageData.totalDomNodes.toLocaleString()} DOM nodes</span>
                  <span>|</span>
                  <span>{auditData.pageData.resourceCount} requests</span>
                </div>
              </div>

              <AuditResult data={auditData} />

              <button
                onClick={handleGetFixes}
                disabled={loadingFixes}
                className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors mt-3 mb-3"
              >
                {loadingFixes ? "Getting AI Fixes..." : "Get AI Fix Suggestions"}
              </button>

              {fixError && (
                <p className="text-xs text-red-400 mt-1 mb-2">{fixError}</p>
              )}

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
          {selectedHistory ? (
            <div>
              <button
                onClick={() => setSelectedHistory(null)}
                className="text-xs text-cyan-400 hover:text-cyan-300 mb-2 flex items-center gap-1"
              >
                ← Back to history
              </button>
              <div className="bg-gray-900 rounded-lg p-3 mb-2">
                <div className="text-cyan-400 text-sm truncate mb-1">{selectedHistory.url}</div>
                <div className="text-gray-500 text-[10px]">{new Date(selectedHistory.timestamp).toLocaleString()}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <ScoreCard label="Performance" score={selectedHistory.scores.performance} />
                <ScoreCard label="SEO" score={selectedHistory.scores.seo} />
                <ScoreCard label="Accessibility" score={selectedHistory.scores.accessibility} />
              </div>
              <AuditResult data={selectedHistory} />
            </div>
          ) : (
            <>
              {history.length > 0 && (
                <div className="flex justify-end mb-1">
                  <button
                    onClick={async () => { await clearHistory(); setHistory([]); }}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                  >
                    Clear history
                  </button>
                </div>
              )}
              {history.length === 0 ? (
                <p className="text-gray-500 text-sm text-center mt-8">No audit history yet</p>
              ) : (
                history.map((item, i) => {
                  const urlHistory = history.filter((h) => h.url === item.url);
                  const avg = Math.round((item.scores.performance + item.scores.seo + item.scores.accessibility) / 3);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedHistory(item)}
                      className="w-full bg-gray-900 rounded-lg p-3 text-sm text-left hover:bg-gray-800/70 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-cyan-400 truncate max-w-[180px]">{item.url}</span>
                        <span className="text-gray-500 text-xs">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex gap-3 text-xs">
                          <ScorePill label="Perf" score={item.scores.performance} />
                          <ScorePill label="SEO" score={item.scores.seo} />
                          <ScorePill label="A11y" score={item.scores.accessibility} />
                        </div>
                        {urlHistory.length > 1 && (
                          <Sparkline
                            values={urlHistory.slice(0, 8).reverse().map((h) =>
                              Math.round((h.scores.performance + h.scores.seo + h.scores.accessibility) / 3)
                            )}
                            current={avg}
                          />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-300 mb-2">AI Fix Suggestions</h2>
            <p className="text-xs text-gray-500 mb-3">
              Enter your Anthropic API key to enable AI-powered fix suggestions. Get one at{" "}
              <a href="https://console.anthropic.com" target="_blank" rel="noopener" className="text-cyan-400 hover:underline">
                console.anthropic.com
              </a>
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setApiKeySaved(false); }}
              placeholder="sk-ant-api03-..."
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => {
                chrome.storage.local.set({ anthropic_api_key: apiKey }, () => {
                  setApiKeySaved(true);
                  setTimeout(() => setApiKeySaved(false), 2000);
                });
              }}
              className="mt-2 w-full py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm font-medium transition-colors"
            >
              {apiKeySaved ? "Saved!" : "Save API Key"}
            </button>
            {apiKey && (
              <button
                onClick={() => {
                  setApiKey("");
                  chrome.storage.local.remove("anthropic_api_key");
                }}
                className="mt-2 w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-red-400 transition-colors"
              >
                Remove Key
              </button>
            )}
          </div>
          <div className="border-t border-gray-800 pt-3">
            <p className="text-xs text-gray-600">
              Your API key is stored locally in your browser and is only sent to Anthropic's API when you click "Get AI Fix Suggestions".
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ScorePill({ label, score }: { label: string; score: number }) {
  const color = score >= 90 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  return <span className={color}>{label}: {score}</span>;
}

function ScanStep({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={done ? "text-green-400" : "text-gray-600"}>{done ? "+" : "-"}</span>
      <span className={done ? "text-gray-300" : "text-gray-600"}>{label}</span>
    </div>
  );
}

function VitalPill({ label, value, unit, format, good, poor }: {
  label: string;
  value: number | null;
  unit: string;
  format: (v: number) => string;
  good: number;
  poor: number;
}) {
  if (value === null) return (
    <div className="bg-gray-900 rounded px-2 py-1.5 text-center">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="text-xs text-gray-600">--</div>
    </div>
  );
  const color = value <= good ? "text-green-400" : value <= poor ? "text-yellow-400" : "text-red-400";
  const bg = value <= good ? "border-green-400/20" : value <= poor ? "border-yellow-400/20" : "border-red-400/20";
  return (
    <div className={`bg-gray-900 border ${bg} rounded px-2 py-1.5 text-center`}>
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className={`text-xs font-medium ${color}`}>{format(value)}{unit}</div>
    </div>
  );
}

function Sparkline({ values, current }: { values: number[]; current: number }) {
  if (values.length < 2) return null;
  const w = 48, h = 20, pad = 2;
  const min = Math.min(...values) - 5;
  const max = Math.max(...values) + 5;
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const color = current >= 90 ? "#4ade80" : current >= 50 ? "#facc15" : "#f87171";
  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      {values.length > 0 && (() => {
        const lastX = pad + ((values.length - 1) / (values.length - 1)) * (w - pad * 2);
        const lastY = h - pad - ((values[values.length - 1] - min) / range) * (h - pad * 2);
        return <circle cx={lastX} cy={lastY} r="2" fill={color} />;
      })()}
    </svg>
  );
}

function analyzeCurrentPage() {
  const perf = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];

  const images = document.querySelectorAll("img");
  const links = document.querySelectorAll("a");
  const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  const scripts = document.querySelectorAll("script");
  const buttons = document.querySelectorAll("button, [role=\"button\"]");

  // Check heading order
  const headingLevels = Array.from(headings).map((h) => parseInt(h.tagName[1]));
  let headingOrderValid = true;
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] > headingLevels[i - 1] + 1) {
      headingOrderValid = false;
      break;
    }
  }

  // DOM depth
  function getMaxDepth(el: Element, depth: number): number {
    let max = depth;
    // Only check first few children to avoid performance issues
    const children = el.children;
    const limit = Math.min(children.length, 10);
    for (let i = 0; i < limit; i++) {
      max = Math.max(max, getMaxDepth(children[i], depth + 1));
    }
    return max;
  }
  const maxDomDepth = getMaxDepth(document.documentElement, 0);

  // Duplicate IDs
  const allIds = Array.from(document.querySelectorAll("[id]")).map((el) => el.id);
  const seen = new Set<string>();
  let duplicateIds = 0;
  for (const id of allIds) {
    if (seen.has(id)) duplicateIds++;
    seen.add(id);
  }

  // Render-blocking resources
  const renderBlocking = Array.from(document.querySelectorAll(
    'link[rel="stylesheet"]:not([media="print"]):not([disabled]), script:not([async]):not([defer]):not([type="module"])'
  )).filter((el) => {
    if (el.tagName === "SCRIPT") return !!(el as HTMLScriptElement).src;
    return true;
  }).length;

  // Third-party scripts
  const currentHost = location.hostname;
  const thirdPartyScripts = Array.from(scripts).filter((s) => {
    if (!s.src) return false;
    try { return new URL(s.src).hostname !== currentHost; } catch { return false; }
  }).length;

  // Images analysis
  const imgArray = Array.from(images);
  const imagesWithoutDimensions = imgArray.filter(
    (img) => !img.width && !img.height && !img.getAttribute("width") && !img.getAttribute("height")
  ).length;

  // Large images (check naturalWidth as proxy since we can't get file size from DOM)
  const largeImageCount = imgArray.filter(
    (img) => img.naturalWidth > 2000 || img.naturalHeight > 2000
  ).length;

  // Resource stats from Performance API
  let totalResourceSize = 0;
  for (const r of resources) {
    totalResourceSize += r.transferSize || 0;
  }

  // Buttons without text
  const buttonsWithoutText = Array.from(buttons).filter(
    (btn) => !btn.textContent?.trim() && !btn.getAttribute("aria-label") && !btn.getAttribute("title")
  ).length;

  // Skip link
  const hasSkipLink = !!document.querySelector('a[href^="#main"], a[href^="#content"], [class*="skip"]');

  // Tabindex issues
  const tabindexIssues = document.querySelectorAll("[tabindex]").length > 0
    ? Array.from(document.querySelectorAll("[tabindex]")).filter(
        (el) => parseInt(el.getAttribute("tabindex") || "0") > 0
      ).length
    : 0;

  // aria-hidden on focusable
  const ariaHiddenOnFocusable = Array.from(
    document.querySelectorAll('[aria-hidden="true"] a, [aria-hidden="true"] button, [aria-hidden="true"] input')
  ).length;

  // Empty links
  const emptyLinks = Array.from(links).filter(
    (a) => !a.href || a.href === location.href + "#" || a.href === "javascript:void(0)"
  ).length;

  // Social meta tag count
  const socialMetaTags = document.querySelectorAll(
    'meta[property^="og:"], meta[name^="twitter:"]'
  ).length;

  // Core Web Vitals
  const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
  const lcp = lcpEntries.length > 0 ? (lcpEntries[lcpEntries.length - 1] as any).startTime : null;

  const clsEntries = performance.getEntriesByType("layout-shift");
  const cls = clsEntries.length > 0
    ? clsEntries.reduce((sum, entry) => {
        if (!(entry as any).hadRecentInput) sum += (entry as any).value;
        return sum;
      }, 0)
    : null;

  const paintEntries = performance.getEntriesByType("paint");
  const fcp = paintEntries.find((e) => e.name === "first-contentful-paint")?.startTime ?? null;

  const ttfb = perf ? perf.responseStart - perf.startTime : null;

  return {
    title: document.title,
    titleLength: document.title.length,
    metaDescription: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
    metaDescriptionLength: (document.querySelector('meta[name="description"]')?.getAttribute("content") || "").length,
    metaViewport: !!document.querySelector('meta[name="viewport"]'),
    charset: !!document.querySelector("meta[charset]"),
    lang: document.documentElement.lang || "",
    imageCount: images.length,
    imagesWithoutAlt: imgArray.filter((img) => !img.alt).length,
    imagesWithoutDimensions,
    largeImageCount,
    linkCount: links.length,
    externalLinkCount: Array.from(links).filter((a) => { try { return new URL(a.href).hostname !== currentHost; } catch { return false; } }).length,
    linksWithoutText: Array.from(links).filter((a) => !a.textContent?.trim() && !a.getAttribute("aria-label")).length,
    headingCount: headings.length,
    hasH1: !!document.querySelector("h1"),
    h1Count: document.querySelectorAll("h1").length,
    headingOrderValid,
    scriptCount: scripts.length,
    inlineScriptCount: Array.from(scripts).filter((s) => !s.src && s.textContent?.trim()).length,
    stylesheetCount: document.querySelectorAll('link[rel="stylesheet"]').length,
    inlineStyleCount: document.querySelectorAll("[style]").length,
    totalDomNodes: document.querySelectorAll("*").length,
    maxDomDepth,
    hasCanonical: !!document.querySelector('link[rel="canonical"]'),
    hasRobotsMeta: !!document.querySelector('meta[name="robots"]'),
    hasOpenGraph: !!document.querySelector('meta[property="og:title"]'),
    hasTwitterCard: !!document.querySelector('meta[name="twitter:card"]'),
    hasStructuredData: !!document.querySelector('script[type="application/ld+json"]'),
    hasFavicon: !!document.querySelector('link[rel="icon"], link[rel="shortcut icon"]'),
    isHttps: location.protocol === "https:",
    formInputsWithoutLabel: Array.from(document.querySelectorAll("input:not([type='hidden']), select, textarea")).filter(
      (el) => !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby") && (!el.id || !document.querySelector(`label[for="${el.id}"]`))
    ).length,
    buttonsWithoutText,
    hasSkipLink,
    tabindexIssues,
    ariaHiddenOnFocusable,
    renderBlockingResources: renderBlocking,
    totalResourceSize,
    resourceCount: resources.length,
    pageLoadTime: perf ? perf.loadEventEnd - perf.startTime : 0,
    domContentLoaded: perf ? perf.domContentLoadedEventEnd - perf.startTime : 0,
    thirdPartyScripts,
    hasServiceWorker: !!navigator.serviceWorker?.controller,
    duplicateIds,
    emptyLinks,
    metaKeywords: !!document.querySelector('meta[name="keywords"]'),
    hasSitemap: false, // Can't detect from client-side
    socialMetaTags,
    lcp,
    cls,
    fcp,
    ttfb,
  };
}
