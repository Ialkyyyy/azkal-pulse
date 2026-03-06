import React, { useState } from "react";
import { AIFix } from "../../ai/claude";

interface Props {
  fix: AIFix;
}

export function FixSuggestion({ fix }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fix.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-xs font-medium text-purple-400">{fix.title}</h4>
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            fix.impact === "high"
              ? "bg-red-900/50 text-red-400"
              : fix.impact === "medium"
                ? "bg-yellow-900/50 text-yellow-400"
                : "bg-blue-900/50 text-blue-400"
          }`}
        >
          {fix.impact}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-2">{fix.description}</p>
      {fix.code && (
        <div className="relative">
          <pre className="bg-gray-950 rounded p-2 text-xs text-gray-300 overflow-x-auto">
            <code>{fix.code}</code>
          </pre>
          <button
            onClick={handleCopy}
            className="absolute top-1 right-1 text-xs px-2 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
