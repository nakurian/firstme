import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { analyses } from "@/lib/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const db = getDb();
  const row = db
    .select()
    .from(analyses)
    .where(eq(analyses.id, id))
    .get();

  if (!row) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  const result = {
    ...row,
    affected_files: row.affected_files ? JSON.parse(row.affected_files) : null,
    evidence: row.evidence ? JSON.parse(row.evidence) : null,
  };

  return NextResponse.json(result);
}
