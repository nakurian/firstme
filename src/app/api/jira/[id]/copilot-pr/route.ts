import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { jiraTasks } from "@/lib/db/schema";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const db = getDb();
  const task = db
    .select()
    .from(jiraTasks)
    .where(eq(jiraTasks.id, id))
    .get();

  if (!task) {
    return NextResponse.json({ error: "Jira task not found" }, { status: 404 });
  }

  if (task.status !== "completed" || !task.title) {
    return NextResponse.json(
      { error: "Task must be completed before creating a PR" },
      { status: 400 },
    );
  }

  // Parse repo identifier to get owner/repo
  const repoId = task.repo_identifier;
  let owner: string;
  let repo: string;

  if (repoId.includes("github.com")) {
    // URL format: https://github.com/owner/repo or https://github.com/owner/repo.git
    const match = repoId.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (!match) {
      return NextResponse.json(
        { error: "Cannot parse GitHub owner/repo from URL" },
        { status: 400 },
      );
    }
    owner = match[1];
    repo = match[2];
  } else if (repoId.includes("/") && !repoId.startsWith("/")) {
    // org/repo format
    const parts = repoId.split("/");
    owner = parts[0];
    repo = parts[1];
  } else {
    return NextResponse.json(
      { error: "Copilot PR requires a GitHub repo (org/repo format)" },
      { status: 400 },
    );
  }

  // Build problem statement from the Jira task analysis
  const subtasks = task.subtasks ? JSON.parse(task.subtasks) : [];
  const acceptanceCriteria = task.acceptance_criteria
    ? JSON.parse(task.acceptance_criteria)
    : [];
  const affectedFiles = task.affected_files
    ? JSON.parse(task.affected_files)
    : [];

  const problemStatement = [
    task.description || task.task_description,
    "",
    "## Acceptance Criteria",
    ...acceptanceCriteria.map((c: string, i: number) => `${i + 1}. ${c}`),
    "",
    "## Technical Details",
    task.technical_details || "",
    "",
    "## Affected Files",
    ...affectedFiles.map((f: string) => `- ${f}`),
    ...(subtasks.length > 0
      ? [
          "",
          "## Subtasks",
          ...subtasks.map(
            (s: { title: string; description: string }) =>
              `- **${s.title}**: ${s.description}`
          ),
        ]
      : []),
  ].join("\n");

  // Return the data needed for the Copilot MCP call
  // The frontend will trigger the actual MCP call
  return NextResponse.json({
    owner,
    repo,
    title: task.title,
    problemStatement,
  });
}
