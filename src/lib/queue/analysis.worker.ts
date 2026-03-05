import { Worker, Job } from "bullmq";
import { eq } from "drizzle-orm";
import { getRedis, getBullMQConnection } from "./connection";
import { getDb } from "../db";
import { analyses, analysisEvents } from "../db/schema";
import { ensureRepo } from "../engine/clone";
import { buildAnalysisPrompt } from "../engine/prompt-builder";
import { runClaudeAnalysis } from "../engine/claude-runner";
import { parseAnalysisResult } from "../engine/result-parser";
import type { AnalysisJobData } from "./analysis.queue";
import type { ProgressEvent } from "../types/analysis";

async function processAnalysis(job: Job<AnalysisJobData>) {
  const { analysisId, repoIdentifier, errorLogs, description, instructions, allowWriteTools } = job.data;
  const db = getDb();
  const redis = getRedis();

  const publishEvent = async (event: ProgressEvent) => {
    // Store in DB for late joiners
    db.insert(analysisEvents).values({
      analysis_id: analysisId,
      event_type: event.type,
      data: JSON.stringify(event),
      created_at: Date.now(),
    }).run();

    // Publish to Redis for live SSE
    await redis.publish(`analysis:${analysisId}`, JSON.stringify(event));
  };

  try {
    // Mark as running
    db.update(analyses)
      .set({ status: "running", updated_at: Date.now() })
      .where(eq(analyses.id, analysisId))
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
      message: "Repository ready. Starting Claude analysis...",
      timestamp: Date.now(),
    });

    // Step 2: Build prompt
    const prompt = buildAnalysisPrompt({ errorLogs, description, instructions });

    // Step 3: Run Claude
    const rawOutput = await runClaudeAnalysis({
      prompt,
      cwd: repoPath,
      allowWriteTools,
      onProgress: async (event) => {
        await publishEvent(event);
      },
    });

    // Step 4: Parse result
    const result = parseAnalysisResult(rawOutput);

    // Step 5: Update DB
    db.update(analyses)
      .set({
        status: "completed",
        summary: result.summary,
        root_cause: result.root_cause,
        affected_files: JSON.stringify(result.affected_files),
        evidence: JSON.stringify(result.evidence),
        suggested_fix: result.suggested_fix,
        confidence: result.confidence,
        risk_level: result.risk_level,
        raw_output: rawOutput,
        updated_at: Date.now(),
      })
      .where(eq(analyses.id, analysisId))
      .run();

    await publishEvent({
      type: "result",
      message: "Analysis complete",
      data: result,
      timestamp: Date.now(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    db.update(analyses)
      .set({
        status: "failed",
        error_message: message,
        updated_at: Date.now(),
      })
      .where(eq(analyses.id, analysisId))
      .run();

    await publishEvent({
      type: "error",
      message,
      timestamp: Date.now(),
    });

    throw error; // Let BullMQ mark the job as failed
  }
}

export function createAnalysisWorker() {
  const worker = new Worker<AnalysisJobData>("analysis", processAnalysis, {
    connection: getBullMQConnection(),
    concurrency: 2,
  });

  worker.on("completed", (job) => {
    console.log(`Analysis ${job.data.analysisId} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Analysis ${job?.data.analysisId} failed:`, error.message);
  });

  return worker;
}
