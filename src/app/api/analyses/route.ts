import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { analyses } from "@/lib/db/schema";
import { addAnalysisJob } from "@/lib/queue/analysis.queue";
import type { AnalysisSource, AnalysisStatus } from "@/lib/types/analysis";

const CreateAnalysisSchema = z.object({
  repo_identifier: z.string().min(1),
  error_logs: z.string().min(1),
  description: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  allow_write_tools: z.boolean().optional(),
});

function parseAnalysisRow(row: typeof analyses.$inferSelect) {
  return {
    ...row,
    affected_files: row.affected_files ? JSON.parse(row.affected_files) : null,
    evidence: row.evidence ? JSON.parse(row.evidence) : null,
  };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateAnalysisSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { repo_identifier, error_logs, description, instructions, allow_write_tools } = parsed.data;

  const id = crypto.randomUUID();
  const now = Date.now();

  const db = getDb();
  db.insert(analyses)
    .values({
      id,
      status: "pending",
      source: "web",
      repo_identifier,
      error_logs,
      description: description || null,
      created_at: now,
      updated_at: now,
    })
    .run();

  await addAnalysisJob({
    analysisId: id,
    repoIdentifier: repo_identifier,
    errorLogs: error_logs,
    description: description || undefined,
    instructions: instructions || undefined,
    allowWriteTools: allow_write_tools,
  });

  return NextResponse.json({ analysisId: id }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as AnalysisStatus | null;
  const source = searchParams.get("source") as AnalysisSource | null;
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
  const offset = Number(searchParams.get("offset")) || 0;

  const db = getDb();

  let query = db.select().from(analyses).$dynamic();

  if (status) {
    query = query.where(eq(analyses.status, status));
  }
  if (source) {
    query = query.where(eq(analyses.source, source));
  }

  const rows = query
    .orderBy(desc(analyses.created_at))
    .limit(limit)
    .offset(offset)
    .all();

  const results = rows.map(parseAnalysisRow);

  return NextResponse.json(results);
}
