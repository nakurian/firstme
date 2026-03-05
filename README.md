# FirstMe - AI-Powered Incident Resolution & Jira Ticket Creation

FirstMe analyzes production errors against actual codebases using AI (Claude CLI + GitHub Copilot) to produce structured root cause analysis and generate Jira tickets.

## Features

- **Error Analysis** - Paste error logs + point to a repo. Claude analyzes the codebase and returns root cause, affected files, suggested fix, confidence level.
- **Jira Ticket Creation** - Describe a task + point to a repo. Copilot analyzes the codebase and creates a detailed Jira ticket with acceptance criteria, subtasks, and technical details.
- **Webhook Integration** - Splunk and ServiceNow can trigger analyses automatically via webhooks.
- **Live Progress** - Real-time streaming of analysis progress via Server-Sent Events.
- **Retry with Instructions** - Re-run any analysis with additional context or different instructions.

## Prerequisites

- **Node.js** 20+ ([nodejs.org](https://nodejs.org))
- **Docker** ([docker.com](https://docker.com)) - for Redis
- **Claude CLI** - for error analysis (`claude -p` headless mode, requires Claude Pro/Max subscription)
- **GitHub CLI with Copilot** - for Jira ticket creation (`gh copilot`, requires GitHub Copilot subscription)

## Quick Start

```bash
# 1. Clone and setup (installs deps, starts Redis, creates config)
git clone git@github.com:nakurian/firstme.git && cd firstme
npm run setup

# 2. Start everything (web UI + worker in one command)
npm run app
```

Open **http://localhost:3000**

That's it.

## What Each Command Does

| Command | Description |
|---------|-------------|
| `npm run setup` | Install deps, create `.env.local`, start Redis, prepare database |
| `npm run app` | Start web UI + background worker (single command) |
| `npm run dev` | Start only the Next.js web UI |
| `npm run worker` | Start only the background worker |

## Usage

### Error Analysis (uses Claude)
1. Go to **http://localhost:3000**
2. Click **"New Analysis"**
3. Enter a repo (e.g. `org/repo` or `/path/to/local/repo`)
4. Paste error logs
5. Optionally add instructions (e.g. "Create a PR with the fix")
6. Check **"Allow code changes"** if you want Claude to modify files / create PRs
7. Submit and watch live progress

### Jira Ticket Creation (uses Copilot)
1. Go to **http://localhost:3000**
2. Click **"Create Jira Ticket"**
3. Enter a repo, task description, Jira project key, and issue type
4. Copilot analyzes the codebase and creates the Jira issue via Atlassian MCP
5. View the structured ticket with acceptance criteria, subtasks, and affected files

### Webhook (automated)
```bash
# Splunk
curl -X POST http://localhost:3000/api/webhooks/splunk \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: dev-secret" \
  -d '{"result":{"_raw":"ERROR NullPointerException at com.example...","host":"my-service-prod"}}'

# ServiceNow
curl -X POST http://localhost:3000/api/webhooks/servicenow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-secret" \
  -d '{"incident_number":"INC001","short_description":"Prod error","description":"...","ci":"my-service-prod"}'
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyses` | POST | Create analysis |
| `/api/analyses` | GET | List analyses |
| `/api/analyses/[id]` | GET | Get single analysis |
| `/api/analyses/[id]/stream` | GET | SSE progress stream |
| `/api/analyses/[id]/retry` | POST | Retry with new instructions |
| `/api/jira` | POST | Create Jira ticket task |
| `/api/jira` | GET | List Jira tasks |
| `/api/jira/[id]` | GET | Get single Jira task |
| `/api/jira/[id]/stream` | GET | SSE progress stream |
| `/api/webhooks/splunk` | POST | Splunk webhook |
| `/api/webhooks/servicenow` | POST | ServiceNow webhook |

## Configuration

Edit `.env.local`:

```
REDIS_URL=redis://localhost:6379      # Redis connection
DATABASE_URL=./data/firstme.db        # SQLite database path
REPOS_CACHE_DIR=/tmp/firstme-repos    # Where repos are cloned
GITHUB_TOKEN=                         # For cloning private repos
WEBHOOK_SECRET=dev-secret             # Secret for webhook auth
```

## Architecture

```
Web UI / Webhooks --> BullMQ Queue (Redis) --> Worker
                                                |
                                     Claude CLI (error analysis)
                                     Copilot CLI (Jira creation)
                                                |
                                          SQLite DB
                                     Redis Pub/Sub --> SSE
```

- **Next.js 15** - Web UI + API routes
- **BullMQ + Redis** - Job queue for async processing
- **SQLite + Drizzle ORM** - Persistent storage
- **Claude CLI** (`claude -p`) - Headless error analysis
- **Copilot CLI** (`gh copilot -p`) - Headless Jira ticket creation

## Tech Stack

TypeScript, Next.js 15 (App Router), Tailwind CSS v4, SQLite (better-sqlite3), Drizzle ORM, BullMQ, Redis, simple-git
