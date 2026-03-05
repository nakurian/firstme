import { z } from "zod";

export const AnalysisResultSchema = z.object({
  summary: z.string(),
  root_cause: z.string(),
  affected_files: z.array(z.string()),
  evidence: z.array(z.string()),
  suggested_fix: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  risk_level: z.enum(["critical", "high", "medium", "low"]),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export type AnalysisStatus = "pending" | "running" | "completed" | "failed";
export type AnalysisSource = "web" | "splunk" | "servicenow";

export interface Analysis {
  id: string;
  status: AnalysisStatus;
  source: AnalysisSource;
  repo_identifier: string;
  error_logs: string;
  description: string | null;
  summary: string | null;
  root_cause: string | null;
  affected_files: string[] | null;
  evidence: string[] | null;
  suggested_fix: string | null;
  confidence: string | null;
  risk_level: string | null;
  raw_output: string | null;
  pr_url: string | null;
  error_message: string | null;
  created_at: number;
  updated_at: number;
}

export interface ProgressEvent {
  type: "progress" | "result" | "error";
  message?: string;
  data?: unknown;
  timestamp: number;
}
