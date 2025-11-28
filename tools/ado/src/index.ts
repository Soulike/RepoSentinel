export * as getRepoInfo from './get-repo-info.js';
export * as getRecentCommits from './get-recent-commits.js';
export * as getCommitDetails from './get-commit-details.js';
export * as getCommitDiff from './get-commit-diff.js';
export * as getFileContent from './get-file-content.js';
export * as getFileHistory from './get-file-history.js';
export * as compareCommits from './compare-commits.js';

export type {GetRepoInfoParams} from './get-repo-info.js';
export type {GetRecentCommitsParams} from './get-recent-commits.js';
export type {GetCommitDetailsParams} from './get-commit-details.js';
export type {GetCommitDiffParams} from './get-commit-diff.js';
export type {GetFileContentParams} from './get-file-content.js';
export type {GetFileHistoryParams} from './get-file-history.js';
export type {CompareCommitsParams} from './compare-commits.js';

import * as getRepoInfo from './get-repo-info.js';
import * as getRecentCommits from './get-recent-commits.js';
import * as getCommitDetails from './get-commit-details.js';
import * as getCommitDiff from './get-commit-diff.js';
import * as getFileContent from './get-file-content.js';
import * as getFileHistory from './get-file-history.js';
import * as compareCommits from './compare-commits.js';

/**
 * Array of all Azure DevOps tools for bulk registration with ToolRegistry.
 *
 * @example
 * ```typescript
 * import { allTools } from '@openai-tools/ado';
 * import { ToolRegistry } from '@ai/openai-session';
 *
 * const registry = new ToolRegistry();
 * for (const tool of allTools) {
 *   registry.register(tool.definition, tool.handler);
 * }
 * ```
 */
export const allTools = [
  getRepoInfo,
  getRecentCommits,
  getCommitDetails,
  getCommitDiff,
  getFileContent,
  getFileHistory,
  compareCommits,
] as const;
