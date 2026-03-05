import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey(),
  status: text("status").notNull().default("pending"), // pending | running | completed | failed
  source: text("source").notNull(), // web | splunk | servicenow
  repo_identifier: text("repo_identifier").notNull(),
  error_logs: text("error_logs").notNull(),
  description: text("description"),
  summary: text("summary"),
  root_cause: text("root_cause"),
  affected_files: text("affected_files"), // JSON array
  evidence: text("evidence"), // JSON array
  suggested_fix: text("suggested_fix"),
  confidence: text("confidence"), // high | medium | low
  risk_level: text("risk_level"), // critical | high | medium | low
  raw_output: text("raw_output"),
  pr_url: text("pr_url"),
  error_message: text("error_message"),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});

export const analysisEvents = sqliteTable("analysis_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  analysis_id: text("analysis_id")
    .notNull()
    .references(() => analyses.id),
  event_type: text("event_type").notNull(), // progress | result | error
  data: text("data").notNull(), // JSON
  created_at: integer("created_at").notNull(),
});

export const jiraTasks = sqliteTable("jira_tasks", {
  id: text("id").primaryKey(),
  status: text("status").notNull().default("pending"), // pending | running | completed | failed
  repo_identifier: text("repo_identifier").notNull(),
  task_description: text("task_description").notNull(),
  project_key: text("project_key").notNull(),
  issue_type: text("issue_type").notNull().default("Story"),
  instructions: text("instructions"),
  title: text("title"),
  description: text("description"),
  acceptance_criteria: text("acceptance_criteria"), // JSON array
  technical_details: text("technical_details"),
  affected_files: text("affected_files"), // JSON array
  subtasks: text("subtasks"), // JSON array
  labels: text("labels"), // JSON array
  estimated_effort: text("estimated_effort"),
  raw_output: text("raw_output"),
  jira_url: text("jira_url"),
  error_message: text("error_message"),
  created_at: integer("created_at").notNull(),
  updated_at: integer("updated_at").notNull(),
});

export const jiraTaskEvents = sqliteTable("jira_task_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jira_task_id: text("jira_task_id")
    .notNull()
    .references(() => jiraTasks.id),
  event_type: text("event_type").notNull(), // progress | result | error
  data: text("data").notNull(), // JSON
  created_at: integer("created_at").notNull(),
});
