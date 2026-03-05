import { NextRequest, NextResponse } from "next/server";
import { config, resolveRepo } from "@/lib/config";
import { getDb } from "@/lib/db";
import { analyses } from "@/lib/db/schema";
import { addAnalysisJob } from "@/lib/queue/analysis.queue";
import type { SplunkWebhookPayload } from "@/lib/types/webhook";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("X-Webhook-Secret");
  if (!secret || secret !== config.webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SplunkWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const errorLogs = payload.result?._raw || payload.result?.raw;
  if (!errorLogs) {
    return NextResponse.json(
      { error: "Missing error logs in result._raw or result.raw" },
      { status: 400 },
    );
  }

  const host = payload.result?.host || payload.result?.source;
  if (!host) {
    return NextResponse.json(
      { error: "Missing host or source in result" },
      { status: 400 },
    );
  }

  const repoIdentifier = resolveRepo(host);
  if (!repoIdentifier) {
    return NextResponse.json(
      { error: `Unable to resolve repo for host: ${host}` },
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
      source: "splunk",
      repo_identifier: repoIdentifier,
      error_logs: errorLogs,
      created_at: now,
      updated_at: now,
    })
    .run();

  await addAnalysisJob({
    analysisId: id,
    repoIdentifier,
    errorLogs,
  });

  return NextResponse.json({ analysisId: id }, { status: 202 });
}
