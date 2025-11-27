import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {gerritFetch, buildUrl} from './gerrit-helpers.js';

export interface GetChangedFilesParams {
  host: string;
  changeId: string;
  revision?: string;
}

interface FileInfo {
  status?: string;
  lines_inserted?: number;
  lines_deleted?: number;
  size_delta?: number;
  size?: number;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'gerrit_get_changed_files',
    description: `Get the list of files changed in a Gerrit change revision.

Returns: JSON array of changed files with stats.`,
    parameters: {
      type: 'object',
      properties: {
        host: {
          type: 'string',
          description: 'Gerrit host (e.g., chromium-review.googlesource.com).',
        },
        changeId: {
          type: 'string',
          description: 'Change ID (numeric ID or full change ID).',
        },
        revision: {
          type: 'string',
          description:
            'Revision ID (commit SHA or patch set number). Defaults to current.',
        },
      },
      required: ['host', 'changeId'],
    },
  },
};

export const handler: ToolFunction<GetChangedFilesParams> = async (args) => {
  const revision = args.revision ?? 'current';
  const url = buildUrl(
    args.host,
    `/changes/${args.changeId}/revisions/${revision}/files/`,
  );

  const data = await gerritFetch<Record<string, FileInfo>>(url);

  // Convert map to array, excluding /COMMIT_MSG
  const files = Object.entries(data)
    .filter(([path]) => path !== '/COMMIT_MSG')
    .map(([path, info]) => ({
      path,
      status: info.status ?? 'M',
      insertions: info.lines_inserted ?? 0,
      deletions: info.lines_deleted ?? 0,
    }));

  return JSON.stringify(files);
};
