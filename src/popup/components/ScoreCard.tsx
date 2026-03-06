import React from "react";

interface ScoreCardProps {
  label: string;
  score: number;
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

export function ScoreCard({ label, score }: ScoreCardProps) {
  return (
    <div
      className={`border ${getBg(score)} rounded-lg p-3 text-center bg-gray-900`}
    >
      <div className={`text-2xl font-bold ${getColor(score)}`}>{score}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}
