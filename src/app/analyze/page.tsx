"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AnalyzePage() {
  const router = useRouter();
  const [repoIdentifier, setRepoIdentifier] = useState("");
  const [errorLogs, setErrorLogs] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [allowWriteTools, setAllowWriteTools] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_identifier: repoIdentifier,
          error_logs: errorLogs,
          description: description || null,
          instructions: instructions || null,
          allow_write_tools: allowWriteTools,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      router.push(`/analysis/${data.analysisId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-gray-400 hover:text-gray-200"
      >
        &larr; Back to Dashboard
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-gray-100">New Analysis</h1>
      <p className="mb-8 text-gray-400">
        Submit an incident for AI-powered root cause analysis.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Repo Identifier */}
        <div>
          <label
            htmlFor="repo"
            className="mb-1.5 block text-sm font-medium text-gray-300"
          >
            Repository Identifier
          </label>
          <input
            id="repo"
            type="text"
            required
            value={repoIdentifier}
            onChange={(e) => setRepoIdentifier(e.target.value)}
            placeholder="org/repo or /path/to/local/repo"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Error Logs */}
        <div>
          <label
            htmlFor="logs"
            className="mb-1.5 block text-sm font-medium text-gray-300"
          >
            Error Logs
          </label>
          <textarea
            id="logs"
            required
            rows={12}
            value={errorLogs}
            onChange={(e) => setErrorLogs(e.target.value)}
            placeholder="Paste error logs here..."
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 font-mono text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="desc"
            className="mb-1.5 block text-sm font-medium text-gray-300"
          >
            Description{" "}
            <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            id="desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional context about the incident..."
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Instructions */}
        <div>
          <label
            htmlFor="instructions"
            className="mb-1.5 block text-sm font-medium text-gray-300"
          >
            Instructions{" "}
            <span className="text-gray-500">(optional)</span>
          </label>
          <textarea
            id="instructions"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Create a PR with the fix, Focus on the auth module, Check for race conditions..."
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Allow Write Tools */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={allowWriteTools}
            onChange={(e) => setAllowWriteTools(e.target.checked)}
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

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Start Analysis"}
        </button>
      </form>
    </div>
  );
}
