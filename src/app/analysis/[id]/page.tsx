"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Analysis } from "@/lib/types/analysis";
import StatusBadge from "@/components/StatusBadge";
import ProgressStream from "@/components/ProgressStream";
import ResultDisplay from "@/components/ResultDisplay";

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const [retryInstructions, setRetryInstructions] = useState("");
  const [retryContext, setRetryContext] = useState("");
  const [retryAllowWrite, setRetryAllowWrite] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    try {
      const res = await fetch(`/api/analyses/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
      const data = await res.json();
      setAnalysis(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleStreamComplete = useCallback(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  async function handleRetry() {
    setRetrying(true);
    try {
      const res = await fetch(`/api/analyses/${id}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructions: retryInstructions || null,
          additional_context: retryContext || null,
          allow_write_tools: retryAllowWrite,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Retry failed (${res.status})`);
      }
      const data = await res.json();
      router.push(`/analysis/${data.analysisId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
      setRetrying(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="py-20 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-gray-400 hover:text-gray-200"
        >
          &larr; Back to Dashboard
        </Link>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-red-400">
          {error ?? "Analysis not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-gray-400 hover:text-gray-200"
      >
        &larr; Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-100">
            Analysis
          </h1>
          <StatusBadge status={analysis.status} />
        </div>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>
            Source: <span className="text-gray-300">{analysis.source}</span>
          </span>
          <span>
            Repo:{" "}
            <span className="font-mono text-gray-300">
              {analysis.repo_identifier}
            </span>
          </span>
          <span>
            ID: <span className="font-mono text-gray-400">{analysis.id}</span>
          </span>
        </div>
      </div>

      {/* Content based on status */}
      {(analysis.status === "pending" || analysis.status === "running") && (
        <ProgressStream
          analysisId={analysis.id}
          onComplete={handleStreamComplete}
        />
      )}

      {analysis.status === "completed" && (
        <ResultDisplay analysis={analysis} />
      )}

      {analysis.status === "failed" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-400">
            Analysis Failed
          </h3>
          <p className="text-red-300">
            {analysis.error_message ?? "An unknown error occurred during analysis."}
          </p>
        </div>
      )}

      {/* Retry panel for completed or failed */}
      {(analysis.status === "completed" || analysis.status === "failed") && (
        <div className="mt-8 border-t border-gray-800 pt-8">
          {!showRetry ? (
            <button
              onClick={() => setShowRetry(true)}
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
            >
              Retry Analysis
            </button>
          ) : (
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Retry Analysis
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="retry-instructions"
                    className="mb-1.5 block text-sm font-medium text-gray-300"
                  >
                    Instructions <span className="text-gray-500">(optional)</span>
                  </label>
                  <textarea
                    id="retry-instructions"
                    rows={3}
                    value={retryInstructions}
                    onChange={(e) => setRetryInstructions(e.target.value)}
                    placeholder="e.g. Create a PR with the fix, Focus on a different module, Check for race conditions..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="retry-context"
                    className="mb-1.5 block text-sm font-medium text-gray-300"
                  >
                    Additional Context <span className="text-gray-500">(optional)</span>
                  </label>
                  <textarea
                    id="retry-context"
                    rows={3}
                    value={retryContext}
                    onChange={(e) => setRetryContext(e.target.value)}
                    placeholder="Any extra logs, observations, or context to add..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 font-mono text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={retryAllowWrite}
                    onChange={(e) => setRetryAllowWrite(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-300">
                      Allow code changes
                    </span>
                    <p className="text-xs text-gray-500">
                      Enables Edit, Write, and Bash tools — required for PR creation and code fixes
                    </p>
                  </div>
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={handleRetry}
                    disabled={retrying}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {retrying ? "Submitting..." : "Start Retry"}
                  </button>
                  <button
                    onClick={() => setShowRetry(false)}
                    className="rounded-lg px-4 py-2.5 text-sm text-gray-400 transition-colors hover:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
