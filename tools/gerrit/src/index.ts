export * as getDirectoryChanges from './get-directory-changes.js';
export * as getFileChanges from './get-file-changes.js';
export * as getChangeDetails from './get-change-details.js';
export * as getChangeDiff from './get-change-diff.js';
export * as getFileContent from './get-file-content.js';
export * as getProjectInfo from './get-project-info.js';
export * as getChangedFiles from './get-changed-files.js';

export type {GetDirectoryChangesParams} from './get-directory-changes.js';
export type {GetFileChangesParams} from './get-file-changes.js';
export type {GetChangeDetailsParams} from './get-change-details.js';
export type {GetChangeDiffParams} from './get-change-diff.js';
export type {GetFileContentParams} from './get-file-content.js';
export type {GetProjectInfoParams} from './get-project-info.js';
export type {GetChangedFilesParams} from './get-changed-files.js';

import * as getDirectoryChanges from './get-directory-changes.js';
import * as getFileChanges from './get-file-changes.js';
import * as getChangeDetails from './get-change-details.js';
import * as getChangeDiff from './get-change-diff.js';
import * as getFileContent from './get-file-content.js';
import * as getProjectInfo from './get-project-info.js';
import * as getChangedFiles from './get-changed-files.js';

/**
 * Array of all Gerrit tools for bulk registration with ToolRegistry.
 *
 * @example
 * ```typescript
 * import { allTools } from '@openai-tools/gerrit';
 * import { ToolRegistry } from '@ai/openai-session';
 *
 * const registry = new ToolRegistry();
 * for (const tool of allTools) {
 *   registry.register(tool.definition, tool.handler);
 * }
 * ```
 */
export const allTools = [
  getDirectoryChanges,
  getFileChanges,
  getChangeDetails,
  getChangeDiff,
  getFileContent,
  getProjectInfo,
  getChangedFiles,
] as const;
