import { NextRequest, NextResponse } from "next/server";
import { config, resolveRepo } from "@/lib/config";
import { getDb } from "@/lib/db";
import { analyses } from "@/lib/db/schema";
import { addAnalysisJob } from "@/lib/queue/analysis.queue";
import type { ServiceNowWebhookPayload } from "@/lib/types/webhook";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token || token !== config.webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: ServiceNowWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload.ci) {
    return NextResponse.json(
      { error: "Missing ci field" },
      { status: 400 },
    );
  }

  const repoIdentifier = resolveRepo(payload.ci);
  if (!repoIdentifier) {
    return NextResponse.json(
      { error: `Unable to resolve repo for ci: ${payload.ci}` },
      { status: 400 },
    );
  }

  const errorLogParts = [
    payload.description,
    payload.error_logs,
    payload.stack_trace,
  ].filter(Boolean);

  const errorLogs = errorLogParts.join("\n\n");
  if (!errorLogs) {
    return NextResponse.json(
      { error: "No error information provided (description, error_logs, or stack_trace)" },
      { status: 400 },
    );
  }

  const id = crypto.randomUUID();
  const now = Date.now();

  const db = getDb();
  db.insert(analyses)
    .values({
      id,
      status: "pending",
      source: "servicenow",
      repo_identifier: repoIdentifier,
      error_logs: errorLogs,
      description: payload.short_description || null,
      created_at: now,
      updated_at: now,
    })
    .run();

  await addAnalysisJob({
    analysisId: id,
    repoIdentifier,
    errorLogs,
    description: payload.short_description,
  });

  return NextResponse.json({ analysisId: id }, { status: 202 });
}
