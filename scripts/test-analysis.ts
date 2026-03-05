import { ensureRepo } from "../src/lib/engine/clone";
import { buildAnalysisPrompt } from "../src/lib/engine/prompt-builder";
import { runClaudeAnalysis } from "../src/lib/engine/claude-runner";
import { parseAnalysisResult } from "../src/lib/engine/result-parser";
import fs from "fs";

async function main() {
  const args = process.argv.slice(2);
  const repoIdx = args.indexOf("--repo");
  const logsIdx = args.indexOf("--logs");

  if (repoIdx === -1 || logsIdx === -1) {
    console.error("Usage: npx tsx scripts/test-analysis.ts --repo <path-or-org/repo> --logs <error-log-file>");
    process.exit(1);
  }

  const repoIdentifier = args[repoIdx + 1];
  const logsPath = args[logsIdx + 1];

  if (!repoIdentifier || !logsPath) {
    console.error("Both --repo and --logs are required");
    process.exit(1);
  }

  const errorLogs = fs.readFileSync(logsPath, "utf-8");

  console.log(`Repo: ${repoIdentifier}`);
  console.log(`Logs: ${logsPath} (${errorLogs.length} chars)`);
  console.log("---");

  console.log("Step 1: Ensuring repo is available...");
  const repoPath = await ensureRepo(repoIdentifier);
  console.log(`Repo path: ${repoPath}`);

  console.log("Step 2: Building prompt...");
  const prompt = buildAnalysisPrompt({ errorLogs });
  console.log(`Prompt length: ${prompt.length} chars`);

  console.log("Step 3: Running Claude analysis...");
  const rawOutput = await runClaudeAnalysis({
    prompt,
    cwd: repoPath,
    onProgress: (event) => {
      console.log(`  [${event.type}] ${event.message}`);
    },
  });

  console.log("Step 4: Parsing result...");
  const result = parseAnalysisResult(rawOutput);

  console.log("\n=== RESULT ===");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
