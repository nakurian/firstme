interface JiraPromptInput {
  taskDescription: string;
  projectKey: string;
  issueType: string;
  instructions?: string;
}

export function buildJiraPrompt(input: JiraPromptInput): string {
  const userInstructions = input.instructions
    ? `\n## Additional Instructions\n${input.instructions}\n`
    : "";

  return `You are an expert software engineer. Your job is to analyze a codebase and then CREATE a Jira issue using the Atlassian MCP tools.

## Task Description
${input.taskDescription}
${userInstructions}
## Step 1: Analyze the Codebase

Thoroughly explore the codebase:
1. Read key configuration files (package.json, tsconfig.json, build configs, etc.)
2. Examine the directory structure and understand the architecture
3. Identify relevant files, modules, and dependencies related to the task
4. Analyze existing code conventions, frameworks, and libraries in use
5. Determine which files will need to be created or modified
6. Break down the task into concrete implementation steps

Use file reading and search tools extensively to explore the codebase.

## Step 2: Create the Jira Issue

After analyzing the codebase, you MUST use the Atlassian MCP tool \`createJiraIssue\` to create the issue with:
- **Project key**: ${input.projectKey}
- **Issue type**: ${input.issueType}
- **Summary**: A concise title describing the work
- **Description**: A detailed description in Atlassian Document Format (ADF) that includes:
  - Overview of the task
  - Current state of the codebase relevant to this task
  - Technical details and implementation approach
  - Specific files to modify/create (discovered from codebase analysis)
  - Acceptance criteria as a checklist
  - Subtask breakdown if the work is complex
  - Estimated effort (small: <4hrs, medium: 4-16hrs, large: 2-5 days, xlarge: 5+ days)

## Step 3: Report the Result

After creating the Jira issue, respond with ONLY a JSON object (no markdown fences, no extra text) containing the details:

{
  "title": "The title you used for the Jira issue",
  "description": "The full description text you provided",
  "acceptance_criteria": ["criterion 1", "criterion 2"],
  "technical_details": "Implementation approach details",
  "affected_files": ["path/to/file1.ts", "path/to/file2.ts"],
  "subtasks": [{"title": "Subtask title", "description": "What it involves"}],
  "labels": ["suggested-label-1"],
  "estimated_effort": "small|medium|large|xlarge",
  "jira_key": "The Jira issue key returned (e.g. ${input.projectKey}-123)",
  "jira_url": "The URL to the created Jira issue"
}

IMPORTANT: You MUST actually create the Jira issue using the createJiraIssue tool. Do NOT just return JSON without creating the issue first.`;
}
