import React from "react";
import { AuditData } from "../../utils/scoring";

interface Props {
  data: AuditData;
}

export function AuditResult({ data }: Props) {
  return (
    <div className="bg-gray-900 rounded-lg p-3 text-sm space-y-2">
      <h3 className="font-medium text-gray-300 mb-2">Issues Found</h3>
      {data.issues.length === 0 ? (
        <p className="text-green-400 text-xs">No major issues detected!</p>
      ) : (
        data.issues.map((issue, i) => (
          <div key={i} className="flex items-start gap-2">
            <span
              className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                issue.severity === "high"
                  ? "bg-red-400"
                  : issue.severity === "medium"
                    ? "bg-yellow-400"
                    : "bg-blue-400"
              }`}
            />
            <div>
              <p className="text-gray-200 text-xs">{issue.message}</p>
              <p className="text-gray-500 text-xs">{issue.category}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
