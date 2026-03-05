# FirstMe Architecture

## Overview

FirstMe is an AI-powered incident resolution and Jira ticket creation system. It uses headless AI CLIs (Claude and GitHub Copilot) to analyze codebases and produce structured outputs — either root cause analysis for production errors or detailed Jira tickets for new work.

**Key design decision:** No API keys needed. Uses `claude -p` (Claude Pro/Max subscription OAuth) and `gh copilot -p` (GitHub Copilot subscription) for AI, avoiding API key management entirely.

## System Architecture

```
+-------------------+     +------------------------+
|  Next.js Web UI   |     |  Webhook API           |
|  /                |     |  POST /api/webhooks/   |
|  /analyze         |     |  splunk | servicenow   |
|  /analysis/[id]   |     +----------+-------------+
|  /jira            |                |
|  /jira/[id]       |                |
+---------+---------+                |
          |                          |
          +----------+---------------+
                     v
            +------------------+
            |  Next.js API     |
            |  /api/analyses   |
            |  /api/jira       |
            +--------+---------+
                     |
                     v
            +------------------+
            |  BullMQ Queues   | <-- Redis (docker-compose)
            |  "analysis"      |
            |  "jira"          |
            +--------+---------+
                     |
                     v
            +----------------------------+
            |  Worker Process            |  (npx tsx src/worker.ts)
            |                            |
            |  Analysis Worker:          |
            |    1. Clone/update repo    |  (simple-git)
            |    2. Build prompt         |  (prompt-builder.ts)
            |    3. Spawn claude -p      |  (claude-runner.ts)
            |    4. Parse result         |  (result-parser.ts)
            |    5. Store in SQLite      |  (Drizzle ORM)
            |    6. Publish via Redis    |  (pub/sub -> SSE)
            |                            |
            |  Jira Worker:              |
            |    1. Clone/update repo    |  (simple-git)
            |    2. Build prompt         |  (jira-prompt-builder.ts)
            |    3. Spawn gh copilot -p  |  (copilot-runner.ts)
            |    4. Parse result         |  (jira-result-parser.ts)
            |    5. Store in SQLite      |  (Drizzle ORM)
            |    6. Publish via Redis    |  (pub/sub -> SSE)
            +----------------------------+
```

## Directory Structure

```
src/
  app/                              # Next.js App Router
    page.tsx                        # Dashboard (tabbed: Analyses | Jira Tickets)
    layout.tsx                      # Dark theme layout with nav
    globals.css                     # Tailwind v4 config
    analyze/page.tsx                # Manual error analysis form
    analysis/[id]/page.tsx          # Analysis result view + retry
    jira/page.tsx                   # Jira ticket creation form
    jira/[id]/page.tsx              # Jira task result view
    api/
      analyses/route.ts             # POST create, GET list
      analyses/[id]/route.ts        # GET single analysis
      analyses/[id]/stream/route.ts # SSE progress stream
      analyses/[id]/retry/route.ts  # POST retry with new instructions
      jira/route.ts                 # POST create, GET list
      jira/[id]/route.ts            # GET single jira task
      jira/[id]/stream/route.ts     # SSE progress stream
      jira/[id]/copilot-pr/route.ts # POST prepare Copilot PR data
      webhooks/splunk/route.ts      # Splunk webhook
      webhooks/servicenow/route.ts  # ServiceNow webhook
  lib/
    config.ts                       # Env config + repo mapping
    db/
      schema.ts                     # Drizzle schema (analyses, jira_tasks, events)
      index.ts                      # DB connection singleton + auto-migration
    queue/
      connection.ts                 # Redis + BullMQ connection helpers
      analysis.queue.ts             # Analysis queue + addAnalysisJob()
      analysis.worker.ts            # Analysis worker (uses Claude)
      jira.queue.ts                 # Jira queue + addJiraJob()
      jira.worker.ts                # Jira worker (uses Copilot)
    engine/
      clone.ts                      # Git clone/cache with auto branch detection
      claude-runner.ts              # Spawn claude -p, parse stream-json events
      copilot-runner.ts             # Spawn gh copilot -p, capture output
      prompt-builder.ts             # Error analysis prompt construction
      jira-prompt-builder.ts        # Jira ticket prompt (instructs Copilot to use Atlassian MCP)
      result-parser.ts              # Parse Claude JSON output with Zod
      jira-result-parser.ts         # Parse Copilot JSON output with Zod
    types/
      analysis.ts                   # Analysis types + Zod schemas
      webhook.ts                    # Webhook payload types
      jira.ts                       # Jira task types + Zod schemas
  components/
    StatusBadge.tsx                  # Status pill (pending/running/completed/failed)
    ConfidenceBadge.tsx             # Confidence level badge
    RiskBadge.tsx                   # Risk level badge
    ProgressStream.tsx              # SSE consumer (reusable, accepts custom streamUrl)
    ResultDisplay.tsx               # Error analysis result cards
    AnalysisTable.tsx               # Dashboard table for analyses
    JiraResultDisplay.tsx           # Jira ticket result cards + Copy as Markdown
    JiraTable.tsx                   # Dashboard table for Jira tasks
  worker.ts                         # Worker entry point (starts both workers)
scripts/
  setup.sh                          # One-time setup (npm install, Redis, .env, migrations)
  start.sh                          # Start everything (web UI + worker)
  test-analysis.ts                  # CLI test script for engine
drizzle/
  0000_*.sql                        # Initial migration (analyses + analysis_events)
  0001_*.sql                        # Jira migration (jira_tasks + jira_task_events)
docker-compose.yml                  # Redis service
drizzle.config.ts                   # Drizzle ORM configuration
```

## Database Schema

### `analyses` table
Stores error analysis requests and results. Key fields:
- `id` (UUID), `status`, `source` (web/splunk/servicenow)
- `repo_identifier`, `error_logs`, `description`
- Result: `summary`, `root_cause`, `affected_files` (JSON), `evidence` (JSON), `suggested_fix`, `confidence`, `risk_level`
- `raw_output`, `pr_url`, `error_message`
- `created_at`, `updated_at` (epoch ms)

### `analysis_events` table
SSE events for live progress streaming. FK to `analyses.id`.

### `jira_tasks` table
Stores Jira ticket creation requests and results. Key fields:
- `id` (UUID), `status`, `repo_identifier`, `task_description`, `project_key`, `issue_type`
- Result: `title`, `description`, `acceptance_criteria` (JSON), `technical_details`, `affected_files` (JSON), `subtasks` (JSON), `labels` (JSON), `estimated_effort`
- `jira_url`, `raw_output`, `error_message`

### `jira_task_events` table
SSE events for live progress streaming. FK to `jira_tasks.id`.

## AI Engine Details

### Claude Runner (`claude-runner.ts`)
- Spawns `claude -p "<prompt>" --allowedTools "..." --output-format stream-json --verbose --max-turns 20`
- Two tool permission levels:
  - **Read-only** (default): `Read,Glob,Grep,Bash(git log*),Bash(git show*),Bash(git diff*)`
  - **Write** (opt-in checkbox): `Read,Glob,Grep,Edit,Write,Bash`
- Parses newline-delimited JSON stream events
- Extracts final text from `result` event (preferred) > last `assistant` message > full output
- Forwards tool_use events as progress (e.g., "Using Read: path/to/file")
- Configurable timeout (default 5 min)

### Copilot Runner (`copilot-runner.ts`)
- Spawns `gh copilot -- -p "<prompt>" -s --allow-all`
- `-s` = silent (response only), `--allow-all` = full tool access
- Copilot has Atlassian MCP configured in `~/.copilot/mcp-config.json`
- The Jira prompt instructs Copilot to use `createJiraIssue` tool to actually create the ticket
- Simpler than Claude runner — no stream-json, just captures stdout

### Prompt Design
- **Error analysis prompt**: Instructs Claude to search codebase, trace stack traces, output structured JSON
- **Jira prompt**: Three-step prompt — (1) explore codebase, (2) create Jira issue via MCP tool, (3) report result as JSON
- Both prompts require JSON output matching Zod schemas for type-safe parsing
- Fallback: if JSON parsing fails, raw output is stored and displayed

## Real-time Progress (SSE)

1. Worker publishes events to Redis pub/sub channel (`analysis:{id}` or `jira:{id}`)
2. Events also stored in DB events table (for late joiners)
3. SSE endpoint (`/api/.../stream`) replays stored events, then subscribes to Redis channel
4. Frontend `ProgressStream` component connects via `EventSource`
5. Stream closes on `result` or `error` event

## Key Implementation Decisions

1. **No API keys** — Uses CLI auth (Claude subscription OAuth, GitHub Copilot subscription) instead of Anthropic/OpenAI API keys
2. **Separate worker process** — `claude -p` / `gh copilot -p` can take minutes; async queue prevents blocking HTTP requests
3. **SQLite + Redis** — SQLite for persistence (zero config), Redis for job queue + real-time pub/sub
4. **Auto-migrations** — `getDb()` runs Drizzle migrations on first connection, so both web server and worker stay in sync
5. **Repo caching** — Remote repos shallow-cloned to `/tmp/firstme-repos/`, updated with `git pull` on subsequent runs. Local paths used as-is (no modification to working tree)
6. **BullMQ connection** — Uses `{ url: string }` config instead of IORedis instances to avoid version conflicts between `ioredis` and BullMQ's bundled copy
7. **`better-sqlite3` in Next.js** — Added to `serverExternalPackages` in `next.config.ts` since it's a native C++ addon that can't be webpack-bundled
8. **Turbopack disabled** — Using `next dev --webpack` due to a Turbopack bug with Google Fonts in Next.js 16

## Extending the System

### Adding a new AI-powered flow
1. Create types in `src/lib/types/`
2. Add DB table in `src/lib/db/schema.ts`, run `npm run db:generate`
3. Create prompt builder in `src/lib/engine/`
4. Create result parser in `src/lib/engine/`
5. Add queue + worker in `src/lib/queue/`
6. Register worker in `src/worker.ts`
7. Add API routes in `src/app/api/`
8. Add UI pages + components

### Adding a new webhook source
1. Add payload type in `src/lib/types/webhook.ts`
2. Create route in `src/app/api/webhooks/<source>/route.ts`
3. Map source identifiers to repos in `src/lib/config.ts`

### Changing the AI engine
- Swap `claude-runner.ts` or `copilot-runner.ts` with any CLI that accepts a prompt and returns text
- The runner interface is simple: `(options: { prompt, cwd, onProgress?, timeout? }) => Promise<string>`
