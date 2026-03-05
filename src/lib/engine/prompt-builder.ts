interface PromptInput {
  errorLogs: string;
  description?: string;
  instructions?: string;
}

export function buildAnalysisPrompt(input: PromptInput): string {
  const descriptionSection = input.description
    ? `\n## Additional Context\n${input.description}\n`
    : "";

  const userInstructions = input.instructions
    ? `\n## User Instructions\n${input.instructions}\n`
    : "";

  return `You are an expert incident responder analyzing a production error against this codebase.

## Error Logs
\`\`\`
${input.errorLogs}
\`\`\`
${descriptionSection}${userInstructions}
## Instructions

1. Search the codebase for files and patterns related to the error
2. Trace any stack traces to their source files
3. Identify the root cause of the error
4. Determine affected files and code paths
5. Suggest a fix

You MUST respond with ONLY a JSON object (no markdown fences, no extra text) in this exact format:

{
  "summary": "Brief one-line description of the issue",
  "root_cause": "Detailed explanation of why this error occurs",
  "affected_files": ["path/to/file.ts:42", "path/to/other.ts:15"],
  "evidence": ["Found X pattern in Y file", "Stack trace points to Z"],
  "suggested_fix": "Description of how to fix this issue",
  "confidence": "high|medium|low",
  "risk_level": "critical|high|medium|low"
}`;
}
