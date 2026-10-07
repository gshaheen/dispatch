// Cloudflare Artifacts Wrapper for Dispatch
import { Env } from "./types";

export interface RepoInfo {
  id?: string;
  name: string;
  defaultBranch: string;
  remote?: string;
  token?: string;
}

export class ArtifactsService {
  constructor(private env: Env) {}

  /**
   * Get handle to a repository
   */
  async getRepo(name: string) {
    if (!this.env.ARTIFACTS) {
      throw new Error("ARTIFACTS binding is not available in environment");
    }
    return await this.env.ARTIFACTS.get(name);
  }

  /**
   * Get metadata info for a repository
   */
  async getRepoInfo(name: string): Promise<RepoInfo> {
    const repo = await this.getRepo(name);
    if (!repo) {
      throw new Error(`Repository ${name} not found`);
    }
    const info = await repo.info();
    return {
      name,
      defaultBranch: info.defaultBranch || "main",
      remote: info.remote,
    };
  }

  /**
   * Fork a repository for an agent task
   */
  async forkRepo(sourceName: string, targetName: string): Promise<{ name: string; remote: string; token: string }> {
    const sourceRepo = await this.getRepo(sourceName);
    if (!sourceRepo) {
      throw new Error(`Source repository ${sourceName} not found`);
    }

    const forkResult = await sourceRepo.fork(targetName);
    return {
      name: forkResult.name || targetName,
      remote: forkResult.remote,
      token: forkResult.token,
    };
  }

  /**
   * Read a file from a repository at a specific git ref
   */
  async readFile(repoName: string, filePath: string, ref: string = "main"): Promise<string | null> {
    const repo = await this.getRepo(repoName);
    if (!repo) return null;

    try {
      const file = await repo.readFile({ ref, path: filePath });
      if (!file) return null;
      return typeof file.text === "function" ? await file.text() : String(file);
    } catch (err) {
      console.warn(`Failed to read ${filePath} in ${repoName}@${ref}:`, err);
      return null;
    }
  }

  /**
   * List all repositories in the namespace with cursor pagination
   */
  async listRepos(): Promise<Array<{ name: string }>> {
    if (!this.env.ARTIFACTS || typeof this.env.ARTIFACTS.list !== "function") {
      return [];
    }
    const allRepos: Array<{ name: string }> = [];
    let cursor: string | undefined = undefined;

    do {
      try {
        const result: any = await this.env.ARTIFACTS.list(cursor ? { cursor } : undefined);
        const list = result?.repos || (Array.isArray(result) ? result : []);
        for (const item of list) {
          if (item?.name) allRepos.push({ name: item.name });
        }
        cursor = result?.cursor;
      } catch (err) {
        console.warn("Failed to list repos page:", err);
        break;
      }
    } while (cursor);

    return allRepos;
  }

  /**
   * Delete an ephemeral repository fork
   */
  async deleteRepo(name: string): Promise<boolean> {
    if (!this.env.ARTIFACTS) return false;
    try {
      if (typeof this.env.ARTIFACTS.delete === "function") {
        await this.env.ARTIFACTS.delete(name);
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn(`Error deleting repository ${name}:`, err?.message || err);
      return false;
    }
  }

  /**
   * Prune all task and reconcile forks created during agent executions
   */
  async pruneEphemeralForks(): Promise<string[]> {
    const repos = await this.listRepos();
    const deleted: string[] = [];

    // Delete any matching from namespace listing
    for (const repo of repos) {
      const name = repo.name;
      if (name.startsWith("task-") || name.startsWith("reconcile-")) {
        const ok = await this.deleteRepo(name);
        if (ok) deleted.push(name);
      }
    }

    // Also check known names recorded in D1 to catch any unlisted forks
    try {
      const intentRows = await this.env.DB.prepare("SELECT fork_repo_name FROM intents").all<{ fork_repo_name: string }>();
      for (const r of (intentRows.results || [])) {
        if (r.fork_repo_name && !deleted.includes(r.fork_repo_name)) {
          const ok = await this.deleteRepo(r.fork_repo_name);
          if (ok) deleted.push(r.fork_repo_name);
        }
      }

      const recRows = await this.env.DB.prepare("SELECT reconciled_repo_name FROM reconciliations").all<{ reconciled_repo_name: string }>();
      for (const r of (recRows.results || [])) {
        if (r.reconciled_repo_name && !deleted.includes(r.reconciled_repo_name)) {
          const ok = await this.deleteRepo(r.reconciled_repo_name);
          if (ok) deleted.push(r.reconciled_repo_name);
        }
      }
    } catch (e) {
      // D1 query error during cleanup fallback
    }

    return deleted;
  }
}
