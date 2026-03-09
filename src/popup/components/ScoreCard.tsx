import React from "react";

interface ScoreCardProps {
  label: string;
  score: number | null;
  delta?: number;
}

function getColor(score: number): string {
  if (score >= 90) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function getBg(score: number): string {
  if (score >= 90) return "border-green-400/30";
  if (score >= 50) return "border-yellow-400/30";
  return "border-red-400/30";
}

function getRingColor(score: number): string {
  if (score >= 90) return "stroke-green-400";
  if (score >= 50) return "stroke-yellow-400";
  return "stroke-red-400";
}

export function ScoreCard({ label, score, delta }: ScoreCardProps) {
  const isRevealed = score !== null;
  const displayScore = score ?? 0;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (circumference * displayScore) / 100;

  return (
    <div
      className={`border ${isRevealed ? getBg(displayScore) : "border-gray-800"} rounded-lg p-3 text-center bg-gray-900 transition-all duration-300`}
    >
      <div className="relative w-16 h-16 mx-auto mb-1">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#1f2937" strokeWidth="4" />
          {isRevealed && (
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              className={`${getRingColor(displayScore)} transition-all duration-500`}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {isRevealed ? (
            <span className={`text-lg font-bold ${getColor(displayScore)}`}>
              {displayScore}
            </span>
          ) : (
            <span className="text-lg text-gray-600">--</span>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-400">{label}</div>
      {isRevealed && delta !== undefined && delta !== 0 && (
        <div className={`text-[10px] mt-0.5 ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {delta > 0 ? '+' : ''}{delta}
        </div>
      )}
    </div>
  );
}
