import { spawn } from "child_process";
import { config } from "../config";
import type { ProgressEvent } from "../types/analysis";

interface CopilotRunnerOptions {
  prompt: string;
  cwd: string;
  onProgress?: (event: ProgressEvent) => void;
  timeout?: number;
}

export async function runCopilotAnalysis(
  options: CopilotRunnerOptions
): Promise<string> {
  const { prompt, cwd, onProgress, timeout } = options;
  const effectiveTimeout = timeout || config.claudeTimeout;

  return new Promise((resolve, reject) => {
    const args = [
      "copilot",
      "--",
      "-p", prompt,
      "-s",
      "--allow-all",
    ];

    onProgress?.({
      type: "progress",
      message: "Starting Copilot analysis...",
      timestamp: Date.now(),
    });

    const child = spawn("gh", args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });

    let stdout = "";
    let stderrOutput = "";

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Copilot analysis timed out after ${effectiveTimeout}ms`));
    }, effectiveTimeout);

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;

      // Forward partial output as progress
      const lines = text.split("\n").filter((l) => l.trim());
      for (const line of lines) {
        onProgress?.({
          type: "progress",
          message: line.slice(0, 200),
          timestamp: Date.now(),
        });
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrOutput += chunk.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(
          new Error(
            `Copilot exited with code ${code}: ${stderrOutput || "unknown error"}`
          )
        );
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn gh copilot: ${err.message}`));
    });
  });
}
