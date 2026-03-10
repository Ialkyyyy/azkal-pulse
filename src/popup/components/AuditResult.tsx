import React, { useState } from "react";
import { AuditData, AuditIssue } from "../../utils/scoring";

interface Props {
  data: AuditData;
}

const CATEGORIES = [
  { key: "performance" as const, label: "Performance", icon: "⚡" },
  { key: "seo" as const, label: "SEO", icon: "🔍" },
  { key: "accessibility" as const, label: "Accessibility", icon: "♿" },
];

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function AuditResult({ data }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [severityFilter, setSeverityFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const filtered = severityFilter === "all"
    ? data.issues
    : data.issues.filter((i) => i.severity === severityFilter);

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    issues: filtered
      .filter((i) => i.category === cat.key)
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
  }));

  const severityCounts = {
    high: data.issues.filter((i) => i.severity === "high").length,
    medium: data.issues.filter((i) => i.severity === "medium").length,
    low: data.issues.filter((i) => i.severity === "low").length,
  };

  return (
    <div className="space-y-2">
      {/* Severity filter chips */}
      <div className="flex gap-1.5">
        <FilterChip
          label={`All (${data.issues.length})`}
          active={severityFilter === "all"}
          onClick={() => setSeverityFilter("all")}
        />
        <FilterChip
          label={`High (${severityCounts.high})`}
          active={severityFilter === "high"}
          onClick={() => setSeverityFilter("high")}
          color="red"
        />
        <FilterChip
          label={`Med (${severityCounts.medium})`}
          active={severityFilter === "medium"}
          onClick={() => setSeverityFilter("medium")}
          color="yellow"
        />
        <FilterChip
          label={`Low (${severityCounts.low})`}
          active={severityFilter === "low"}
          onClick={() => setSeverityFilter("low")}
          color="blue"
        />
      </div>

      {/* Grouped issues */}
      {grouped.map((group) => (
        <div key={group.key} className="bg-gray-900 rounded-lg overflow-hidden">
          <button
            onClick={() => setCollapsed((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-800/50 transition-colors"
          >
            <span className="text-xs font-medium text-gray-300">
              {group.icon} {group.label}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">
                {group.issues.length} issue{group.issues.length !== 1 ? "s" : ""}
              </span>
              <span className="text-gray-600 text-xs">{collapsed[group.key] ? "+" : "−"}</span>
            </span>
          </button>
          {!collapsed[group.key] && group.issues.length > 0 && (
            <div className="px-3 pb-2 space-y-1.5">
              {group.issues.map((issue, i) => (
                <IssueRow key={i} issue={issue} />
              ))}
            </div>
          )}
          {!collapsed[group.key] && group.issues.length === 0 && (
            <p className="px-3 pb-2 text-[10px] text-gray-600">No issues in this category</p>
          )}
        </div>
      ))}
    </div>
  );
}

function IssueRow({ issue }: { issue: AuditIssue }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
          issue.severity === "high"
            ? "bg-red-400"
            : issue.severity === "medium"
              ? "bg-yellow-400"
              : "bg-blue-400"
        }`}
      />
      <p className="text-gray-200 text-xs">{issue.message}</p>
    </div>
  );
}

function FilterChip({ label, active, onClick, color }: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: "red" | "yellow" | "blue";
}) {
  const activeClass = active
    ? color === "red" ? "bg-red-900/50 text-red-400 border-red-400/30"
    : color === "yellow" ? "bg-yellow-900/50 text-yellow-400 border-yellow-400/30"
    : color === "blue" ? "bg-blue-900/50 text-blue-400 border-blue-400/30"
    : "bg-cyan-900/50 text-cyan-400 border-cyan-400/30"
    : "bg-gray-900 text-gray-500 border-gray-800 hover:text-gray-300";

  return (
    <button
      onClick={onClick}
      className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${activeClass}`}
    >
      {label}
    </button>
  );
}
