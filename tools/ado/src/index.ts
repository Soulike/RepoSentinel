export {getRepoInfo} from './get-repo-info.js';
export {getRecentCommits} from './get-recent-commits.js';
export {getCommitDetails} from './get-commit-details.js';
export {getCommitDiff} from './get-commit-diff.js';
export {getFileContent} from './get-file-content.js';
export {getFileHistory} from './get-file-history.js';
export {compareCommits} from './compare-commits.js';

export type {GetRepoInfoParams} from './get-repo-info.js';
export type {GetRecentCommitsParams} from './get-recent-commits.js';
export type {GetCommitDetailsParams} from './get-commit-details.js';
export type {GetCommitDiffParams} from './get-commit-diff.js';
export type {GetFileContentParams} from './get-file-content.js';
export type {GetFileHistoryParams} from './get-file-history.js';
export type {CompareCommitsParams} from './compare-commits.js';

import {getRepoInfo} from './get-repo-info.js';
import {getRecentCommits} from './get-recent-commits.js';
import {getCommitDetails} from './get-commit-details.js';
import {getCommitDiff} from './get-commit-diff.js';
import {getFileContent} from './get-file-content.js';
import {getFileHistory} from './get-file-history.js';
import {compareCommits} from './compare-commits.js';

/**
 * Array of all Azure DevOps tools for bulk registration with ToolRegistry.
 *
 * @example
 * ```typescript
 * import { allTools } from '@openai-tools/ado';
 * import { ToolRegistry } from '@ai/openai-session';
 *
 * const registry = new ToolRegistry();
 * registry.registerAll(allTools);
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
];
