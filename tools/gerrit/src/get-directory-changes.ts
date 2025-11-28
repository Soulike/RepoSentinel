import type {OpenAITool} from '@ai/openai-session';
import {fetchChanges} from './helpers/changes.js';
import {buildGerritQuery, formatGerritTimestamp} from './helpers/query.js';
import type {GerritBaseParams} from './helpers/types.js';

export interface GetDirectoryChangesParams extends GerritBaseParams {
  branch: string;
  hours: number;
  directory?: string;
}

export const getDirectoryChanges: OpenAITool<GetDirectoryChangesParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'gerrit_get_directory_changes',
      description: `Get recent merged changes from a branch within the last N hours, optionally filtered by directory.
Use this for getting all changes or filtering by directory path.
For filtering by specific file, use gerrit_get_file_changes instead.

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
          directory: {
            type: 'string',
            description:
              'Optional directory path to filter changes by (e.g., src/components).',
          },
        },
        required: ['host', 'project', 'branch', 'hours'],
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
      dir: args.directory,
    });

    const changes = await fetchChanges(args.host, query);

    return JSON.stringify(changes);
  },
};
