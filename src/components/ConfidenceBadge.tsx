"use client";

const levelStyles: Record<string, string> = {
  high: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ConfidenceBadge({
  level,
}: {
  level: "high" | "medium" | "low";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${levelStyles[level]}`}
    >
      {level} confidence
    </span>
  );
}
