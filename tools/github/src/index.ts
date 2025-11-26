// GitHub helper utilities
export {createOctokit, type GitHubBaseParams} from './github-helpers.js';

// Individual tools - definitions and handlers
export * as getRepoStatus from './get-repo-status.js';
export * as getRecentCommits from './get-recent-commits.js';
export * as getCommitDetails from './get-commit-details.js';
export * as getCommitDiff from './get-commit-diff.js';
export * as getFileContent from './get-file-content.js';
export * as getFileHistory from './get-file-history.js';

// Re-export types
export type {GetRepoStatusParams} from './get-repo-status.js';
export type {Commit, GetRecentCommitsParams} from './get-recent-commits.js';
export type {
  ChangedFile,
  CommitDetails,
  GetCommitDetailsParams,
} from './get-commit-details.js';
export type {GetCommitDiffParams} from './get-commit-diff.js';
export type {GetFileContentParams} from './get-file-content.js';
export type {
  FileHistoryCommit,
  GetFileHistoryParams,
} from './get-file-history.js';

// Convenience: Import all tools for bulk registration
import * as getRepoStatus from './get-repo-status.js';
import * as getRecentCommits from './get-recent-commits.js';
import * as getCommitDetails from './get-commit-details.js';
import * as getCommitDiff from './get-commit-diff.js';
import * as getFileContent from './get-file-content.js';
import * as getFileHistory from './get-file-history.js';

/**
 * Array of all GitHub tools for bulk registration with ToolRegistry.
 *
 * @example
 * ```typescript
 * import { allTools } from '@openai-tools/github';
 * import { ToolRegistry } from '@ai/openai-session';
 *
 * const registry = new ToolRegistry();
 * for (const tool of allTools) {
 *   registry.register(tool.definition, tool.handler);
 * }
 * ```
 */
export const allTools = [
  getRepoStatus,
  getRecentCommits,
  getCommitDetails,
  getCommitDiff,
  getFileContent,
  getFileHistory,
] as const;
