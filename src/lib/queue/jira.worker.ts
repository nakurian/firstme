import { Worker, Job } from "bullmq";
import { eq } from "drizzle-orm";
import { getRedis, getBullMQConnection } from "./connection";
import { getDb } from "../db";
import { jiraTasks, jiraTaskEvents } from "../db/schema";
import { ensureRepo } from "../engine/clone";
import { buildJiraPrompt } from "../engine/jira-prompt-builder";
import { runCopilotAnalysis } from "../engine/copilot-runner";
import { parseJiraResult } from "../engine/jira-result-parser";
import type { JiraJobData } from "./jira.queue";
import type { JiraProgressEvent } from "../types/jira";

async function processJiraTask(job: Job<JiraJobData>) {
  const { taskId, repoIdentifier, taskDescription, projectKey, issueType, instructions } = job.data;
  const db = getDb();
  const redis = getRedis();

  const publishEvent = async (event: JiraProgressEvent) => {
    // Store in DB for late joiners
    db.insert(jiraTaskEvents).values({
      jira_task_id: taskId,
      event_type: event.type,
      data: JSON.stringify(event),
      created_at: Date.now(),
    }).run();

    // Publish to Redis for live SSE
    await redis.publish(`jira:${taskId}`, JSON.stringify(event));
  };

  try {
    // Mark as running
    db.update(jiraTasks)
      .set({ status: "running", updated_at: Date.now() })
      .where(eq(jiraTasks.id, taskId))
      .run();

    await publishEvent({
      type: "progress",
      message: "Cloning/updating repository...",
      timestamp: Date.now(),
    });

    // Step 1: Ensure repo is available
    const repoPath = await ensureRepo(repoIdentifier);

    await publishEvent({
      type: "progress",
      message: "Repository ready. Starting codebase analysis for Jira ticket creation...",
      timestamp: Date.now(),
    });

    // Step 2: Build prompt
    const prompt = buildJiraPrompt({ taskDescription, projectKey, issueType, instructions });

    // Step 3: Run Copilot with full tool access for thorough exploration
    const rawOutput = await runCopilotAnalysis({
      prompt,
      cwd: repoPath,
      onProgress: async (event) => {
        await publishEvent(event);
      },
    });

    // Step 4: Parse result
    const result = parseJiraResult(rawOutput);

    // Step 5: Update DB
    db.update(jiraTasks)
      .set({
        status: "completed",
        title: result.title,
        description: result.description,
        acceptance_criteria: JSON.stringify(result.acceptance_criteria),
        technical_details: result.technical_details,
        affected_files: JSON.stringify(result.affected_files),
        subtasks: result.subtasks ? JSON.stringify(result.subtasks) : null,
        labels: result.labels ? JSON.stringify(result.labels) : null,
        estimated_effort: result.estimated_effort || null,
        jira_url: result.jira_url || null,
        raw_output: rawOutput,
        updated_at: Date.now(),
      })
      .where(eq(jiraTasks.id, taskId))
      .run();

    await publishEvent({
      type: "result",
      message: "Jira ticket content generated",
      data: result,
      timestamp: Date.now(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    db.update(jiraTasks)
      .set({
        status: "failed",
        error_message: message,
        updated_at: Date.now(),
      })
      .where(eq(jiraTasks.id, taskId))
      .run();

    await publishEvent({
      type: "error",
      message,
      timestamp: Date.now(),
    });

    throw error; // Let BullMQ mark the job as failed
  }
}

export function createJiraWorker() {
  const worker = new Worker<JiraJobData>("jira", processJiraTask, {
    connection: getBullMQConnection(),
    concurrency: 2,
  });

  worker.on("completed", (job) => {
    console.log(`Jira task ${job.data.taskId} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Jira task ${job?.data.taskId} failed:`, error.message);
  });

  return worker;
}
