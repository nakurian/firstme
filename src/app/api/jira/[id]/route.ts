import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { jiraTasks } from "@/lib/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const db = getDb();
  const row = db
    .select()
    .from(jiraTasks)
    .where(eq(jiraTasks.id, id))
    .get();

  if (!row) {
    return NextResponse.json({ error: "Jira task not found" }, { status: 404 });
  }

  const result = {
    ...row,
    acceptance_criteria: row.acceptance_criteria ? JSON.parse(row.acceptance_criteria) : null,
    affected_files: row.affected_files ? JSON.parse(row.affected_files) : null,
    subtasks: row.subtasks ? JSON.parse(row.subtasks) : null,
    labels: row.labels ? JSON.parse(row.labels) : null,
  };

  return NextResponse.json(result);
}
