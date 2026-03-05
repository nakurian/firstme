"use client";

import { useState } from "react";
import type { JiraTask } from "@/lib/types/jira";

const effortStyles: Record<string, string> = {
  small: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  large: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  xlarge: "bg-red-500/20 text-red-400 border-red-500/30",
};

function getEffortStyle(effort: string): string {
  const key = effort.toLowerCase().replace(/[^a-z]/g, "");
  return effortStyles[key] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";
}

function buildMarkdown(task: JiraTask): string {
  const parts: string[] = [];

  if (task.title) {
    parts.push(`# ${task.title}`);
  }

  if (task.description) {
    parts.push(`## Description\n\n${task.description}`);
  }

  if (task.acceptance_criteria && task.acceptance_criteria.length > 0) {
    parts.push(
      `## Acceptance Criteria\n\n${task.acceptance_criteria
        .map((c, i) => `${i + 1}. ${c}`)
        .join("\n")}`
    );
  }

  if (task.technical_details) {
    parts.push(`## Technical Details\n\n\`\`\`\n${task.technical_details}\n\`\`\``);
  }

  if (task.affected_files && task.affected_files.length > 0) {
    parts.push(
      `## Affected Files\n\n${task.affected_files.map((f) => `- \`${f}\``).join("\n")}`
    );
  }

  if (task.subtasks && task.subtasks.length > 0) {
    parts.push(
      `## Subtasks\n\n${task.subtasks
        .map((s, i) => `### ${i + 1}. ${s.title}\n\n${s.description}`)
        .join("\n\n")}`
    );
  }

  if (task.labels && task.labels.length > 0) {
    parts.push(`**Labels:** ${task.labels.join(", ")}`);
  }

  if (task.estimated_effort) {
    parts.push(`**Estimated Effort:** ${task.estimated_effort}`);
  }

  return parts.join("\n\n");
}

export default function JiraResultDisplay({ task }: { task: JiraTask }) {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [copilotStatus, setCopilotStatus] = useState<string | null>(null);

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="space-y-6">
      {/* Badges row */}
      <div className="flex flex-wrap gap-3">
        {task.estimated_effort && (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getEffortStyle(task.estimated_effort)}`}
          >
            {task.estimated_effort}
          </span>
        )}
        {task.jira_url && (
          <a
            href={task.jira_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-400 hover:bg-purple-500/30"
          >
            View in Jira
          </a>
        )}
        {task.labels &&
          task.labels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400"
            >
              {label}
            </span>
          ))}
      </div>

      {/* Title */}
      {task.title && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Title
            </h3>
            <button
              onClick={() => copyText(task.title!, "title")}
              className="rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
            >
              {copied === "title" ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-lg font-medium leading-relaxed text-gray-100">
            {task.title}
          </p>
        </div>
      )}

      {/* Description */}
      {task.description && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Description
          </h3>
          <p className="whitespace-pre-wrap leading-relaxed text-gray-200">
            {task.description}
          </p>
        </div>
      )}

      {/* Acceptance Criteria */}
      {task.acceptance_criteria && task.acceptance_criteria.length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Acceptance Criteria
          </h3>
          <ol className="space-y-2">
            {task.acceptance_criteria.map((criterion, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-gray-600 text-xs text-gray-500">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-gray-300">
                  {criterion}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Technical Details */}
      {task.technical_details && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Technical Details
          </h3>
          <pre className="whitespace-pre-wrap rounded-lg bg-gray-800/50 p-4 font-mono text-sm leading-relaxed text-gray-200">
            {task.technical_details}
          </pre>
        </div>
      )}

      {/* Affected Files */}
      {task.affected_files && task.affected_files.length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Affected Files
          </h3>
          <ul className="space-y-1">
            {task.affected_files.map((file, i) => (
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

      {/* Subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Subtasks
          </h3>
          <div className="space-y-3">
            {task.subtasks.map((subtask, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-4"
              >
                <h4 className="mb-1 text-sm font-medium text-gray-200">
                  {i + 1}. {subtask.title}
                </h4>
                <p className="text-sm leading-relaxed text-gray-400">
                  {subtask.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap justify-end gap-3">
        <button
          onClick={() => copyText(buildMarkdown(task), "markdown")}
          className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
        >
          {copied === "markdown" ? "Copied!" : "Copy as Markdown"}
        </button>
        <button
          onClick={async () => {
            setCopilotStatus("loading");
            try {
              const res = await fetch(`/api/jira/${task.id}/copilot-pr`, {
                method: "POST",
              });
              if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.error ?? `Failed (${res.status})`);
              }
              const data = await res.json();
              setCopilotStatus("ready");
              // Store data for the user to confirm
              (window as unknown as Record<string, unknown>).__copilotPrData = data;
            } catch (err) {
              setCopilotStatus(
                err instanceof Error ? err.message : "Failed to prepare PR"
              );
            }
          }}
          disabled={copilotStatus === "loading"}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copilotStatus === "loading"
            ? "Preparing..."
            : "Create PR with Copilot"}
        </button>
      </div>
      {copilotStatus && copilotStatus !== "loading" && copilotStatus !== "ready" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {copilotStatus}
        </div>
      )}
      {copilotStatus === "ready" && (
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-300">
          PR details prepared. Use the GitHub Copilot coding agent to create the PR from your GitHub repository.
        </div>
      )}

      {/* Raw Output (collapsible) */}
      {task.raw_output && (
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
                {task.raw_output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
