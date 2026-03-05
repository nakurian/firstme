import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { jiraTasks } from "@/lib/db/schema";
import { addJiraJob } from "@/lib/queue/jira.queue";
import type { JiraTaskStatus } from "@/lib/types/jira";

const CreateJiraTaskSchema = z.object({
  repo_identifier: z.string().min(1),
  task_description: z.string().min(1),
  project_key: z.string().min(1),
  issue_type: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
});

function parseJiraTaskRow(row: typeof jiraTasks.$inferSelect) {
  return {
    ...row,
    acceptance_criteria: row.acceptance_criteria ? JSON.parse(row.acceptance_criteria) : null,
    affected_files: row.affected_files ? JSON.parse(row.affected_files) : null,
    subtasks: row.subtasks ? JSON.parse(row.subtasks) : null,
    labels: row.labels ? JSON.parse(row.labels) : null,
  };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateJiraTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { repo_identifier, task_description, project_key, issue_type, instructions } = parsed.data;

  const id = crypto.randomUUID();
  const now = Date.now();

  const db = getDb();
  db.insert(jiraTasks)
    .values({
      id,
      status: "pending",
      repo_identifier,
      task_description,
      project_key,
      issue_type: issue_type || "Story",
      instructions: instructions || null,
      created_at: now,
      updated_at: now,
    })
    .run();

  await addJiraJob({
    taskId: id,
    repoIdentifier: repo_identifier,
    taskDescription: task_description,
    projectKey: project_key,
    issueType: issue_type || "Story",
    instructions: instructions || undefined,
  });

  return NextResponse.json({ taskId: id }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") as JiraTaskStatus | null;
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
  const offset = Number(searchParams.get("offset")) || 0;

  const db = getDb();

  let query = db.select().from(jiraTasks).$dynamic();

  if (status) {
    query = query.where(eq(jiraTasks.status, status));
  }

  const rows = query
    .orderBy(desc(jiraTasks.created_at))
    .limit(limit)
    .offset(offset)
    .all();

  const results = rows.map(parseJiraTaskRow);

  return NextResponse.json(results);
}
