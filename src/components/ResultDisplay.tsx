"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/types/analysis";
import ConfidenceBadge from "./ConfidenceBadge";
import RiskBadge from "./RiskBadge";

export default function ResultDisplay({ analysis }: { analysis: Analysis }) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="space-y-6">
      {/* Badges row */}
      <div className="flex flex-wrap gap-3">
        {analysis.confidence && (
          <ConfidenceBadge
            level={analysis.confidence as "high" | "medium" | "low"}
          />
        )}
        {analysis.risk_level && (
          <RiskBadge
            level={
              analysis.risk_level as "critical" | "high" | "medium" | "low"
            }
          />
        )}
        {analysis.pr_url && (
          <a
            href={analysis.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-400 hover:bg-purple-500/30"
          >
            PR Created
          </a>
        )}
      </div>

      {/* Summary */}
      {analysis.summary && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Summary
          </h3>
          <p className="leading-relaxed text-gray-200">{analysis.summary}</p>
        </div>
      )}

      {/* Root Cause */}
      {analysis.root_cause && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Root Cause
          </h3>
          <p className="leading-relaxed text-gray-200">
            {analysis.root_cause}
          </p>
        </div>
      )}

      {/* Affected Files */}
      {analysis.affected_files && analysis.affected_files.length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Affected Files
          </h3>
          <ul className="space-y-1">
            {analysis.affected_files.map((file, i) => (
              <li
                key={i}
                className="rounded bg-gray-800/50 px-3 py-1.5 font-mono text-sm text-amber-300"
              >
                {file}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evidence */}
      {analysis.evidence && analysis.evidence.length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Evidence
          </h3>
          <ul className="list-inside list-disc space-y-2">
            {analysis.evidence.map((item, i) => (
              <li key={i} className="text-sm leading-relaxed text-gray-300">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Fix */}
      {analysis.suggested_fix && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-green-400">
            Suggested Fix
          </h3>
          <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-200">
            {analysis.suggested_fix}
          </p>
        </div>
      )}

      {/* Raw Output (collapsible) */}
      {analysis.raw_output && (
        <div className="rounded-lg border border-gray-800 bg-gray-900">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex w-full items-center justify-between px-5 py-3 text-left text-sm font-medium text-gray-400 hover:text-gray-200"
          >
            <span>Raw Output</span>
            <span className="text-xs">{showRaw ? "Hide" : "Show"}</span>
          </button>
          {showRaw && (
            <div className="max-h-96 overflow-auto border-t border-gray-800 p-4">
              <pre className="whitespace-pre-wrap font-mono text-xs text-gray-400">
                {analysis.raw_output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
