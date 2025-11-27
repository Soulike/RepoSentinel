import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {gerritFetchRaw, buildUrl} from './gerrit-helpers.js';

export interface GetFileContentParams {
  host: string;
  changeId: string;
  revision?: string;
  filePath: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'gerrit_get_file_content',
    description: `Get the content of a file from a Gerrit change revision.

Returns: File content as text.`,
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
        filePath: {
          type: 'string',
          description: 'Path to the file within the repository.',
        },
      },
      required: ['host', 'changeId', 'filePath'],
    },
  },
};

export const handler: ToolFunction<GetFileContentParams> = async (args) => {
  const revision = args.revision ?? 'current';
  const encodedPath = encodeURIComponent(args.filePath);

  const url = buildUrl(
    args.host,
    `/changes/${args.changeId}/revisions/${revision}/files/${encodedPath}/content`,
  );

  const base64Content = await gerritFetchRaw(url);

  // Gerrit returns file content as base64 encoded
  const content = Buffer.from(base64Content, 'base64').toString('utf-8');

  return content;
};
