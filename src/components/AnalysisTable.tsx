"use client";

import Link from "next/link";
import type { Analysis } from "@/lib/types/analysis";
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

export default function AnalysisTable({
  analyses,
}: {
  analyses: Analysis[];
}) {
  if (analyses.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center text-gray-500">
        No analyses found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-800 bg-gray-900/50 text-xs uppercase tracking-wider text-gray-400">
          <tr>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Repository</th>
            <th className="px-4 py-3">Summary</th>
            <th className="px-4 py-3">Confidence</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {analyses.map((a) => (
            <tr
              key={a.id}
              className="bg-gray-900 transition-colors hover:bg-gray-800/70"
            >
              <td className="px-4 py-3">
                <Link href={`/analysis/${a.id}`}>
                  <StatusBadge status={a.status} />
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-300">
                <Link href={`/analysis/${a.id}`}>{a.source}</Link>
              </td>
              <td className="px-4 py-3 font-mono text-sm text-gray-300">
                <Link href={`/analysis/${a.id}`}>{a.repo_identifier}</Link>
              </td>
              <td className="px-4 py-3 text-gray-400">
                <Link href={`/analysis/${a.id}`}>
                  {truncate(a.summary, 80)}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-400">
                <Link href={`/analysis/${a.id}`}>
                  {a.confidence ?? "--"}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                <Link href={`/analysis/${a.id}`}>
                  {timeAgo(a.created_at)}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
