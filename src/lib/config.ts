import path from "path";

export const config = {
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  databaseUrl: process.env.DATABASE_URL || "./data/firstme.db",
  reposCacheDir: process.env.REPOS_CACHE_DIR || "/tmp/firstme-repos",
  githubToken: process.env.GITHUB_TOKEN || "",
  webhookSecret: process.env.WEBHOOK_SECRET || "",
  claudeTimeout: Number(process.env.CLAUDE_TIMEOUT) || 5 * 60 * 1000, // 5 min
  claudeMaxTurns: Number(process.env.CLAUDE_MAX_TURNS) || 20,
} as const;

// Maps host/source identifiers from webhooks to repo identifiers
const REPO_MAPPING: Record<string, string> = {
  "booking-service-prod": "rccl/booking-service",
  "guest-data-prod": "rccl/guest-data-service",
  "voyage-data-prod": "rccl/voyage-data-service",
  "folio-service-prod": "rccl/folio-service",
  // Add more mappings here or load from REPO_MAPPING env var
};

export function resolveRepo(identifier: string): string | undefined {
  return REPO_MAPPING[identifier] || undefined;
}

export function getDatabasePath(): string {
  const dbUrl = config.databaseUrl;
  if (path.isAbsolute(dbUrl)) return dbUrl;
  return path.resolve(process.cwd(), dbUrl);
}
