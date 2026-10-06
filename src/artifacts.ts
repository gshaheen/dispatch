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
   * List all repositories in the namespace
   */
  async listRepos(): Promise<Array<{ name: string }>> {
    if (!this.env.ARTIFACTS || typeof this.env.ARTIFACTS.list !== "function") {
      return [];
    }
    const result = await this.env.ARTIFACTS.list();
    return result.repos || result || [];
  }

  /**
   * Delete an ephemeral repository fork
   */
  async deleteRepo(name: string): Promise<boolean> {
    if (!this.env.ARTIFACTS) return false;
    try {
      await this.env.ARTIFACTS.delete(name);
      return true;
    } catch (err) {
      console.warn(`Error deleting repository ${name}:`, err);
      return false;
    }
  }

  /**
   * Prune all task and reconcile forks created during agent executions
   */
  async pruneEphemeralForks(): Promise<string[]> {
    const repos = await this.listRepos();
    const deleted: string[] = [];

    for (const repo of repos) {
      const name = repo.name;
      if (name.startsWith("task-") || name.startsWith("reconcile-")) {
        const ok = await this.deleteRepo(name);
        if (ok) deleted.push(name);
      }
    }
    return deleted;
  }
}
