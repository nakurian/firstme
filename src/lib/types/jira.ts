import { z } from "zod";

export const JiraTicketResultSchema = z.object({
  title: z.string(),
  description: z.string(),
  acceptance_criteria: z.array(z.string()),
  technical_details: z.string(),
  affected_files: z.array(z.string()),
  subtasks: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).optional(),
  labels: z.array(z.string()).optional(),
  estimated_effort: z.enum(["small", "medium", "large", "xlarge"]).optional(),
  jira_key: z.string().optional(),
  jira_url: z.string().optional(),
});

export type JiraTicketResult = z.infer<typeof JiraTicketResultSchema>;

export type JiraTaskStatus = "pending" | "running" | "completed" | "failed";

export interface JiraTask {
  id: string;
  status: JiraTaskStatus;
  repo_identifier: string;
  task_description: string;
  project_key: string;
  issue_type: string;
  instructions: string | null;
  // Result fields
  title: string | null;
  description: string | null;
  acceptance_criteria: string[] | null;
  technical_details: string | null;
  affected_files: string[] | null;
  subtasks: Array<{ title: string; description: string }> | null;
  labels: string[] | null;
  estimated_effort: string | null;
  raw_output: string | null;
  jira_url: string | null;
  error_message: string | null;
  created_at: number;
  updated_at: number;
}

export interface JiraProgressEvent {
  type: "progress" | "result" | "error";
  message?: string;
  data?: unknown;
  timestamp: number;
}
