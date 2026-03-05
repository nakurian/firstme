import { createAnalysisWorker } from "./lib/queue/analysis.worker";
import { createJiraWorker } from "./lib/queue/jira.worker";
import { getDb } from "./lib/db";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

console.log("Starting FirstMe workers...");

// Run migrations on startup
const db = getDb();
migrate(db, { migrationsFolder: "./drizzle" });
console.log("Database migrations applied.");

// Start the workers
const analysisWorker = createAnalysisWorker();
console.log("Worker listening for analysis jobs.");

const jiraWorker = createJiraWorker();
console.log("Worker listening for jira jobs.");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down workers...");
  await Promise.all([analysisWorker.close(), jiraWorker.close()]);
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down workers...");
  await Promise.all([analysisWorker.close(), jiraWorker.close()]);
  process.exit(0);
});
