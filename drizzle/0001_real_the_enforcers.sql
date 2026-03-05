CREATE TABLE `jira_task_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`jira_task_id` text NOT NULL,
	`event_type` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`jira_task_id`) REFERENCES `jira_tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `jira_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`repo_identifier` text NOT NULL,
	`task_description` text NOT NULL,
	`project_key` text NOT NULL,
	`issue_type` text DEFAULT 'Story' NOT NULL,
	`instructions` text,
	`title` text,
	`description` text,
	`acceptance_criteria` text,
	`technical_details` text,
	`affected_files` text,
	`subtasks` text,
	`labels` text,
	`estimated_effort` text,
	`raw_output` text,
	`jira_url` text,
	`error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
