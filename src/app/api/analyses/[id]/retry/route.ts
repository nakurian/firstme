import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { analyses } from "@/lib/db/schema";
import { addAnalysisJob } from "@/lib/queue/analysis.queue";

const RetrySchema = z.object({
  instructions: z.string().nullable().optional(),
  additional_context: z.string().nullable().optional(),
  allow_write_tools: z.boolean().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is fine — retry with no changes
  }

  const parsed = RetrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  const original = db
    .select()
    .from(analyses)
    .where(eq(analyses.id, id))
    .get();

  if (!original) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  if (original.status === "pending" || original.status === "running") {
    return NextResponse.json(
      { error: "Analysis is still in progress" },
      { status: 409 },
    );
  }

  const { instructions, additional_context, allow_write_tools } = parsed.data;

  // Build combined error logs with any additional context
  let errorLogs = original.error_logs;
  if (additional_context) {
    errorLogs += `\n\n--- Additional Context (retry) ---\n${additional_context}`;
  }

  // Build description combining original + new info
  let description = original.description || "";
  if (original.summary) {
    description += `\n\nPrevious analysis summary: ${original.summary}`;
  }
  if (original.root_cause) {
    description += `\nPrevious root cause: ${original.root_cause}`;
  }

  // Create new analysis record
  const newId = crypto.randomUUID();
  const now = Date.now();

  db.insert(analyses)
    .values({
      id: newId,
      status: "pending",
      source: original.source,
      repo_identifier: original.repo_identifier,
      error_logs: errorLogs,
      description: description || null,
      created_at: now,
      updated_at: now,
    })
    .run();

  await addAnalysisJob({
    analysisId: newId,
    repoIdentifier: original.repo_identifier,
    errorLogs: errorLogs,
    description: description || undefined,
    instructions: instructions || undefined,
    allowWriteTools: allow_write_tools,
  });

  return NextResponse.json({ analysisId: newId }, { status: 201 });
}
