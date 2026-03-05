CREATE TABLE `analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`source` text NOT NULL,
	`repo_identifier` text NOT NULL,
	`error_logs` text NOT NULL,
	`description` text,
	`summary` text,
	`root_cause` text,
	`affected_files` text,
	`evidence` text,
	`suggested_fix` text,
	`confidence` text,
	`risk_level` text,
	`raw_output` text,
	`pr_url` text,
	`error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `analysis_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`analysis_id` text NOT NULL,
	`event_type` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`analysis_id`) REFERENCES `analyses`(`id`) ON UPDATE no action ON DELETE no action
);
