import { AnalysisResultSchema, type AnalysisResult } from "../types/analysis";

/**
 * Parses Claude's output into a structured AnalysisResult.
 * Handles JSON wrapped in markdown code fences or raw JSON.
 * Falls back to a basic result if parsing fails.
 */
export function parseAnalysisResult(rawOutput: string): AnalysisResult {
  const jsonStr = extractJson(rawOutput);

  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      const result = AnalysisResultSchema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: treat raw output as the summary
  return {
    summary: rawOutput.slice(0, 500),
    root_cause: "Unable to parse structured output. See raw output for details.",
    affected_files: [],
    evidence: [],
    suggested_fix: "Review the raw Claude output for suggestions.",
    confidence: "low",
    risk_level: "medium",
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
