"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function JiraPage() {
  const router = useRouter();
  const [repoIdentifier, setRepoIdentifier] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [issueType, setIssueType] = useState("Story");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_identifier: repoIdentifier,
          task_description: taskDescription,
          project_key: projectKey,
          issue_type: issueType,
          instructions: instructions || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      router.push(`/jira/${data.taskId}`);
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

      <h1 className="mb-2 text-2xl font-bold text-gray-100">
        Create Jira Ticket
      </h1>
      <p className="mb-8 text-gray-400">
        Analyze a codebase and generate a structured Jira ticket.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Repository Identifier */}
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

        {/* Task Description */}
        <div>
          <label
            htmlFor="task-desc"
            className="mb-1.5 block text-sm font-medium text-gray-300"
          >
            Task Description
          </label>
          <textarea
            id="task-desc"
            required
            rows={6}
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Describe the feature, bug fix, or task you want to create a ticket for..."
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Project Key */}
        <div>
          <label
            htmlFor="project-key"
            className="mb-1.5 block text-sm font-medium text-gray-300"
          >
            Jira Project Key
          </label>
          <input
            id="project-key"
            type="text"
            required
            value={projectKey}
            onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
            placeholder="e.g. PROJ, MYAPP"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Issue Type */}
        <div>
          <label
            htmlFor="issue-type"
            className="mb-1.5 block text-sm font-medium text-gray-300"
          >
            Issue Type
          </label>
          <select
            id="issue-type"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-gray-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="Story">Story</option>
            <option value="Bug">Bug</option>
            <option value="Task">Task</option>
            <option value="Epic">Epic</option>
          </select>
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
            placeholder="e.g. Focus on the API layer, Include database migration steps..."
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-gray-100 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

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
          {submitting ? "Submitting..." : "Generate Jira Ticket"}
        </button>
      </form>
    </div>
  );
}
