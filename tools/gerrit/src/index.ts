export {getDirectoryChanges} from './get-directory-changes.js';
export {getFileChanges} from './get-file-changes.js';
export {getChangeDetails} from './get-change-details.js';
export {getChangeDiff} from './get-change-diff.js';
export {getFileContent} from './get-file-content.js';
export {getProjectInfo} from './get-project-info.js';
export {getChangedFiles} from './get-changed-files.js';

export type {GetDirectoryChangesParams} from './get-directory-changes.js';
export type {GetFileChangesParams} from './get-file-changes.js';
export type {GetChangeDetailsParams} from './get-change-details.js';
export type {GetChangeDiffParams} from './get-change-diff.js';
export type {GetFileContentParams} from './get-file-content.js';
export type {GetProjectInfoParams} from './get-project-info.js';
export type {GetChangedFilesParams} from './get-changed-files.js';

import {getDirectoryChanges} from './get-directory-changes.js';
import {getFileChanges} from './get-file-changes.js';
import {getChangeDetails} from './get-change-details.js';
import {getChangeDiff} from './get-change-diff.js';
import {getFileContent} from './get-file-content.js';
import {getProjectInfo} from './get-project-info.js';
import {getChangedFiles} from './get-changed-files.js';

/**
 * Array of all Gerrit tools for bulk registration with ToolRegistry.
 *
 * @example
 * ```typescript
 * import { allTools } from '@openai-tools/gerrit';
 * import { ToolRegistry } from '@ai/openai-session';
 *
 * const registry = new ToolRegistry();
 * registry.registerAll(allTools);
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
];
