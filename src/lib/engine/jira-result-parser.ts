import { JiraTicketResultSchema, type JiraTicketResult } from "../types/jira";

/**
 * Parses Claude's output into a structured JiraTicketResult.
 * Handles JSON wrapped in markdown code fences or raw JSON.
 * Falls back to a basic result if parsing fails.
 */
export function parseJiraResult(rawOutput: string): JiraTicketResult {
  const jsonStr = extractJson(rawOutput);

  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      const result = JiraTicketResultSchema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: treat raw output as the description
  return {
    title: "Unable to parse structured output",
    description: rawOutput.slice(0, 1000),
    acceptance_criteria: ["Review raw output and manually create acceptance criteria"],
    technical_details: "Unable to parse structured output. See raw output for details.",
    affected_files: [],
  };
}

function extractJson(text: string): string | null {
  // Try to find JSON in markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // Try to find a top-level JSON object
  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    return text.slice(braceStart, braceEnd + 1);
  }

  return null;
}
