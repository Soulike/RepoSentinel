import type {OpenAITool} from '@ai/openai-session';
import {fetchChanges} from './helpers/changes.js';
import {buildGerritQuery, formatGerritTimestamp} from './helpers/query.js';
import type {GerritBaseParams} from './helpers/types.js';

export interface GetFileChangesParams extends GerritBaseParams {
  branch: string;
  hours: number;
  file: string;
}

export const getFileChanges: OpenAITool<GetFileChangesParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'gerrit_get_file_changes',
      description: `Get recent merged changes that modified a specific file within the last N hours.
Use this for filtering by a specific file path.
For filtering by directory, use gerrit_get_directory_changes instead.

Returns: JSON array of change objects.`,
      parameters: {
        type: 'object',
        properties: {
          host: {
            type: 'string',
            description:
              'Gerrit host (e.g., chromium-review.googlesource.com).',
          },
          project: {
            type: 'string',
            description: 'Project name (e.g., chromium/src).',
          },
          branch: {
            type: 'string',
            description: 'Branch name to get changes from.',
          },
          hours: {
            type: 'number',
            description: 'Number of hours to look back for changes.',
          },
          file: {
            type: 'string',
            description: 'File path to filter changes by (e.g., src/main.ts).',
          },
        },
        required: ['host', 'project', 'branch', 'hours', 'file'],
      },
    },
  },
  handler: async (args) => {
    const since = new Date(Date.now() - args.hours * 60 * 60 * 1000);

    const query = buildGerritQuery({
      project: args.project,
      status: 'merged',
      branch: args.branch,
      after: formatGerritTimestamp(since),
      file: args.file,
    });

    const changes = await fetchChanges(args.host, query);

    return JSON.stringify(changes);
  },
};
