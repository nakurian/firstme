"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Analysis, AnalysisStatus } from "@/lib/types/analysis";
import type { JiraTask, JiraTaskStatus } from "@/lib/types/jira";
import AnalysisTable from "@/components/AnalysisTable";
import JiraTable from "@/components/JiraTable";

type Tab = "analyses" | "jira";

const STATUS_FILTERS: Array<{ label: string; value: AnalysisStatus | "all" }> =
  [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Running", value: "running" },
    { label: "Completed", value: "completed" },
    { label: "Failed", value: "failed" },
  ];

const JIRA_STATUS_FILTERS: Array<{
  label: string;
  value: JiraTaskStatus | "all";
}> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Running", value: "running" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
];

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("analyses");
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [jiraTasks, setJiraTasks] = useState<JiraTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [jiraLoading, setJiraLoading] = useState(false);
  const [filter, setFilter] = useState<AnalysisStatus | "all">("all");
  const [jiraFilter, setJiraFilter] = useState<JiraTaskStatus | "all">("all");

  useEffect(() => {
    async function fetchAnalyses() {
      try {
        const res = await fetch("/api/analyses");
        if (res.ok) {
          const data = await res.json();
          setAnalyses(data);
        }
      } catch {
        // silently handle fetch errors
      } finally {
        setLoading(false);
      }
    }
    fetchAnalyses();
  }, []);

  useEffect(() => {
    if (tab !== "jira") return;
    setJiraLoading(true);
    async function fetchJiraTasks() {
      try {
        const res = await fetch("/api/jira");
        if (res.ok) {
          const data = await res.json();
          setJiraTasks(data);
        }
      } catch {
        // silently handle fetch errors
      } finally {
        setJiraLoading(false);
      }
    }
    fetchJiraTasks();
  }, [tab]);

  const filteredAnalyses =
    filter === "all"
      ? analyses
      : analyses.filter((a) => a.status === filter);

  const filteredJira =
    jiraFilter === "all"
      ? jiraTasks
      : jiraTasks.filter((t) => t.status === jiraFilter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">FirstMe</h1>
          <p className="mt-1 text-gray-400">
            AI-Powered Incident Resolution
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/jira"
            className="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
          >
            Create Jira Ticket
          </Link>
          <Link
            href="/analyze"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            New Analysis
          </Link>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-900 p-1 w-fit">
        <button
          onClick={() => setTab("analyses")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "analyses"
              ? "bg-gray-700 text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Analyses
        </button>
        <button
          onClick={() => setTab("jira")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "jira"
              ? "bg-gray-700 text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Jira Tickets
        </button>
      </div>

      {tab === "analyses" && (
        <>
          {/* Status filter */}
          <div className="mb-6 flex gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f.value
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-20 text-center text-gray-500">Loading...</div>
          ) : (
            <AnalysisTable analyses={filteredAnalyses} />
          )}
        </>
      )}

      {tab === "jira" && (
        <>
          {/* Status filter */}
          <div className="mb-6 flex gap-2">
            {JIRA_STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setJiraFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  jiraFilter === f.value
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {jiraLoading ? (
            <div className="py-20 text-center text-gray-500">Loading...</div>
          ) : (
            <JiraTable tasks={filteredJira} />
          )}
        </>
      )}
    </div>
  );
}
