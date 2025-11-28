import type {OpenAITool} from '@ai/openai-session';
import {gerritFetchRaw, buildUrl} from './helpers/fetch.js';

export interface GetChangeDiffParams {
  host: string;
  changeId: string;
  revision?: string;
}

export const getChangeDiff: OpenAITool<GetChangeDiffParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'gerrit_get_change_diff',
      description: `Get the unified diff/patch for a Gerrit change.

Returns: Plain text unified diff.`,
      parameters: {
        type: 'object',
        properties: {
          host: {
            type: 'string',
            description:
              'Gerrit host (e.g., chromium-review.googlesource.com).',
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
  },
  handler: async (args) => {
    const revision = args.revision ?? 'current';
    const encodedChangeId = encodeURIComponent(args.changeId);
    const url = buildUrl(
      args.host,
      `/changes/${encodedChangeId}/revisions/${revision}/patch`,
    );

    const base64Patch = await gerritFetchRaw(url);

    // Gerrit returns the patch as base64 encoded
    const patch = Buffer.from(base64Patch, 'base64').toString('utf-8');

    return patch || '(no diff content)';
  },
};
