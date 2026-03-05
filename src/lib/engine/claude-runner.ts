import { spawn } from "child_process";
import { config } from "../config";
import type { ProgressEvent } from "../types/analysis";

const READONLY_TOOLS = "Read,Glob,Grep,Bash(git log*),Bash(git show*),Bash(git diff*)";
const WRITE_TOOLS = "Read,Glob,Grep,Edit,Write,Bash";

interface ClaudeRunnerOptions {
  prompt: string;
  cwd: string;
  onProgress?: (event: ProgressEvent) => void;
  timeout?: number;
  maxTurns?: number;
  allowWriteTools?: boolean;
}

interface StreamEvent {
  type: string;
  subtype?: string;
  message?: {
    role?: string;
    content?: Array<{ type: string; text?: string; name?: string; input?: unknown }>;
  };
  result?: {
    role?: string;
    content?: Array<{ type: string; text?: string }>;
  };
  tool_name?: string;
  tool_input?: unknown;
  [key: string]: unknown;
}

export async function runClaudeAnalysis(
  options: ClaudeRunnerOptions
): Promise<string> {
  const { prompt, cwd, onProgress, timeout, maxTurns, allowWriteTools } = options;
  const effectiveTimeout = timeout || config.claudeTimeout;
  const effectiveMaxTurns = maxTurns || config.claudeMaxTurns;
  const tools = allowWriteTools ? WRITE_TOOLS : READONLY_TOOLS;

  return new Promise((resolve, reject) => {
    const args = [
      "-p", prompt,
      "--allowedTools", tools,
      "--output-format", "stream-json",
      "--verbose",
      "--max-turns", String(effectiveMaxTurns),
    ];

    const child = spawn("claude", args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });

    let fullOutput = "";
    let resultText = "";
    let lastAssistantText = "";
    let stderrOutput = "";

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Claude analysis timed out after ${effectiveTimeout}ms`));
    }, effectiveTimeout);

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      fullOutput += text;

      // Parse newline-delimited JSON events
      const lines = text.split("\n").filter((l) => l.trim());
      for (const line of lines) {
        try {
          const event: StreamEvent = JSON.parse(line);
          handleStreamEvent(event, onProgress, (t) => {
            lastAssistantText = t;
          }, (t) => {
            resultText = t;
          });
        } catch {
          // Not valid JSON, skip
        }
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrOutput += chunk.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(resultText || lastAssistantText || fullOutput);
      } else {
        reject(
          new Error(
            `Claude exited with code ${code}: ${stderrOutput || "unknown error"}`
          )
        );
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });
  });
}

function handleStreamEvent(
  event: StreamEvent,
  onProgress?: (event: ProgressEvent) => void,
  onAssistantText?: (text: string) => void,
  onResultText?: (text: string) => void
) {
  const now = Date.now();

  // Extract text from assistant messages
  if (event.type === "assistant" && event.message?.content) {
    for (const block of event.message.content) {
      if (block.type === "text" && block.text) {
        onAssistantText?.(block.text);
      }
    }
  }

  // Extract text from result — this is the final consolidated output
  if (event.type === "result" && event.result?.content) {
    for (const block of event.result.content) {
      if (block.type === "text" && block.text) {
        onResultText?.(block.text);
      }
    }
  }

  // Forward tool use as progress events
  if (event.type === "assistant" && event.message?.content) {
    for (const block of event.message.content) {
      if (block.type === "tool_use" && block.name) {
        const input = block.input as Record<string, unknown> | undefined;
        let detail = "";
        if (block.name === "Read" && input?.file_path) {
          detail = `: ${input.file_path}`;
        } else if (block.name === "Grep" && input?.pattern) {
          detail = `: ${input.pattern}`;
        } else if (block.name === "Glob" && input?.pattern) {
          detail = `: ${input.pattern}`;
        }
        onProgress?.({
          type: "progress",
          message: `Using ${block.name}${detail}`,
          timestamp: now,
        });
      }
    }
  }
}
