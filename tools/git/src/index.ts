// Git helper utilities
export {execGit} from './git-helpers.js';

// Individual tools - named exports
export {getRepoStatus} from './get-repo-status.js';
export {fetchRemote} from './fetch-remote.js';
export {getRecentCommits} from './get-recent-commits.js';
export {getCommitDetails} from './get-commit-details.js';
export {getCommitDiff} from './get-commit-diff.js';
export {getFileContent} from './get-file-content.js';
export {getFileHistory} from './get-file-history.js';
export {getBlame} from './get-blame.js';
export {searchCommits} from './search-commits.js';
export {listChangedFiles} from './list-changed-files.js';

// Re-export types
export type {GetRepoStatusParams} from './get-repo-status.js';
export type {FetchRemoteParams} from './fetch-remote.js';
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
export type {BlameLine, GetBlameParams} from './get-blame.js';
export type {SearchCommit, SearchCommitsParams} from './search-commits.js';
export type {ListChangedFilesParams} from './list-changed-files.js';

// Convenience: Import all tools for bulk registration
import {getRepoStatus} from './get-repo-status.js';
import {fetchRemote} from './fetch-remote.js';
import {getRecentCommits} from './get-recent-commits.js';
import {getCommitDetails} from './get-commit-details.js';
import {getCommitDiff} from './get-commit-diff.js';
import {getFileContent} from './get-file-content.js';
import {getFileHistory} from './get-file-history.js';
import {getBlame} from './get-blame.js';
import {searchCommits} from './search-commits.js';
import {listChangedFiles} from './list-changed-files.js';

/**
 * Array of all git tools for bulk registration with ToolRegistry.
 *
 * @example
 * ```typescript
 * import { allTools } from '@openai-tools/git';
 * import { ToolRegistry } from '@ai/openai-session';
 *
 * const registry = new ToolRegistry();
 * registry.registerAll(allTools);
 * ```
 */
export const allTools = [
  getRepoStatus,
  fetchRemote,
  getRecentCommits,
  getCommitDetails,
  getCommitDiff,
  getFileContent,
  getFileHistory,
  getBlame,
  searchCommits,
  listChangedFiles,
];
