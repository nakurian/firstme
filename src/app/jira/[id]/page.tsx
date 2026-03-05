"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { JiraTask } from "@/lib/types/jira";
import StatusBadge from "@/components/StatusBadge";
import ProgressStream from "@/components/ProgressStream";
import JiraResultDisplay from "@/components/JiraResultDisplay";

export default function JiraDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<JiraTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/jira/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);
      const data = await res.json();
      setTask(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleStreamComplete = useCallback(() => {
    fetchTask();
  }, [fetchTask]);

  async function handleRetry() {
    if (!task) return;
    setRetrying(true);
    try {
      const res = await fetch("/api/jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_identifier: task.repo_identifier,
          task_description: task.task_description,
          project_key: task.project_key,
          issue_type: task.issue_type,
          instructions: task.instructions,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Retry failed (${res.status})`);
      }
      const data = await res.json();
      router.push(`/jira/${data.taskId}`);
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

  if (error || !task) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-gray-400 hover:text-gray-200"
        >
          &larr; Back to Dashboard
        </Link>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-red-400">
          {error ?? "Jira task not found"}
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
          <h1 className="text-2xl font-bold text-gray-100">Jira Ticket</h1>
          <StatusBadge status={task.status} />
        </div>
        <div className="flex gap-4 text-sm text-gray-500">
          <span>
            Project:{" "}
            <span className="font-mono text-gray-300">{task.project_key}</span>
          </span>
          <span>
            Repo:{" "}
            <span className="font-mono text-gray-300">
              {task.repo_identifier}
            </span>
          </span>
          <span>
            Type: <span className="text-gray-300">{task.issue_type}</span>
          </span>
        </div>
      </div>

      {/* Content based on status */}
      {(task.status === "pending" || task.status === "running") && (
        <ProgressStream
          analysisId={task.id}
          streamUrl={`/api/jira/${task.id}/stream`}
          onComplete={handleStreamComplete}
        />
      )}

      {task.status === "completed" && <JiraResultDisplay task={task} />}

      {task.status === "failed" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-red-400">
            Ticket Generation Failed
          </h3>
          <p className="text-red-300">
            {task.error_message ??
              "An unknown error occurred during ticket generation."}
          </p>
        </div>
      )}

      {/* Retry for completed or failed */}
      {(task.status === "completed" || task.status === "failed") && (
        <div className="mt-8 border-t border-gray-800 pt-8">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {retrying ? "Submitting..." : "Retry with Same Inputs"}
          </button>
        </div>
      )}
    </div>
  );
}
