"use client";

import Link from "next/link";
import type { JiraTask } from "@/lib/types/jira";
import StatusBadge from "./StatusBadge";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncate(str: string | null, len: number): string {
  if (!str) return "--";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

const effortColors: Record<string, string> = {
  small: "text-green-400",
  medium: "text-yellow-400",
  large: "text-orange-400",
  xlarge: "text-red-400",
};

function getEffortColor(effort: string | null): string {
  if (!effort) return "text-gray-500";
  const key = effort.toLowerCase().replace(/[^a-z]/g, "");
  return effortColors[key] ?? "text-gray-400";
}

export default function JiraTable({ tasks }: { tasks: JiraTask[] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
        No Jira tickets found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-800 bg-gray-900/50 text-xs uppercase tracking-wider text-gray-400">
          <tr>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Project Key</th>
            <th className="px-4 py-3">Repository</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Effort</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {tasks.map((t) => (
            <tr
              key={t.id}
              className="bg-gray-900 transition-colors hover:bg-gray-800/70"
            >
              <td className="px-4 py-3">
                <Link href={`/jira/${t.id}`}>
                  <StatusBadge status={t.status} />
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-sm text-gray-300">
                <Link href={`/jira/${t.id}`}>{t.project_key}</Link>
              </td>
              <td className="px-4 py-3 font-mono text-sm text-gray-300">
                <Link href={`/jira/${t.id}`}>{t.repo_identifier}</Link>
              </td>
              <td className="px-4 py-3 text-gray-400">
                <Link href={`/jira/${t.id}`}>
                  {truncate(t.title, 60)}
                </Link>
              </td>
              <td className={`px-4 py-3 ${getEffortColor(t.estimated_effort)}`}>
                <Link href={`/jira/${t.id}`}>
                  {t.estimated_effort ?? "--"}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                <Link href={`/jira/${t.id}`}>
                  {timeAgo(t.created_at)}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
