import simpleGit from "simple-git";
import path from "path";
import fs from "fs";
import { config } from "../config";

async function getDefaultBranch(git: ReturnType<typeof simpleGit>): Promise<string> {
  try {
    const remote = await git.remote(["show", "origin"]);
    const match = (remote as string)?.match(/HEAD branch:\s*(\S+)/);
    if (match) return match[1];
  } catch {
    // fallback below
  }

  // Try common branch names
  const branches = await git.branch(["-r"]);
  for (const name of ["origin/main", "origin/master", "origin/develop"]) {
    if (branches.all.includes(name)) return name.replace("origin/", "");
  }

  return "main";
}

/**
 * Ensures a repo is available locally and up-to-date.
 * - Local paths (starting with / or ~): use directly, no checkout (preserves working state)
 * - Remote repos (org/repo or URL): clone or update in cache dir
 * Returns the local path to the repo.
 */
export async function ensureRepo(repoIdentifier: string): Promise<string> {
  // Local path mode — just use it as-is, don't modify working tree
  if (repoIdentifier.startsWith("/") || repoIdentifier.startsWith("~")) {
    const localPath = repoIdentifier.startsWith("~")
      ? repoIdentifier.replace("~", process.env.HOME || "")
      : repoIdentifier;

    if (!fs.existsSync(localPath)) {
      throw new Error(`Local repo path does not exist: ${localPath}`);
    }

    return localPath;
  }

  // Remote repo mode
  const repoUrl = repoIdentifier.includes("://")
    ? repoIdentifier
    : `https://github.com/${repoIdentifier}.git`;

  const repoName = repoIdentifier.replace(/[/:]/g, "_").replace(/\.git$/, "");
  const cachePath = path.join(config.reposCacheDir, repoName);

  if (!fs.existsSync(config.reposCacheDir)) {
    fs.mkdirSync(config.reposCacheDir, { recursive: true });
  }

  if (fs.existsSync(path.join(cachePath, ".git"))) {
    // Cached: pull latest on current branch
    const git = simpleGit(cachePath);
    await git.pull("origin");
  } else {
    // Not cached: shallow clone
    const git = simpleGit();
    await git.clone(repoUrl, cachePath, ["--depth", "1"]);
  }

  return cachePath;
}
