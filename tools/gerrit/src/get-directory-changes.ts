import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {
  gerritFetch,
  buildUrl,
  buildGerritQuery,
  formatGerritTimestamp,
  type GerritBaseParams,
} from './gerrit-helpers.js';

export interface GetDirectoryChangesParams extends GerritBaseParams {
  branch: string;
  hours: number;
  directory?: string;
}

interface ChangeInfo {
  id: string;
  project: string;
  branch: string;
  change_id: string;
  subject: string;
  status: string;
  created: string;
  updated: string;
  insertions: number;
  deletions: number;
  _number: number;
  owner: {name?: string};
}

export const definition: ChatCompletionFunctionTool = {
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
          description: 'Gerrit host (e.g., chromium-review.googlesource.com).',
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
};

export const handler: ToolFunction<GetDirectoryChangesParams> = async (
  args,
) => {
  const since = new Date(Date.now() - args.hours * 60 * 60 * 1000);

  const query = buildGerritQuery({
    project: args.project,
    status: 'merged',
    branch: args.branch,
    after: formatGerritTimestamp(since),
    dir: args.directory,
  });

  const url = buildUrl(args.host, '/changes/', {
    q: query,
    n: '100',
  });

  const data = await gerritFetch<ChangeInfo[]>(url);

  const changes = data.map((change) => ({
    number: change._number,
    changeId: change.change_id,
    subject: change.subject,
    branch: change.branch,
    updated: change.updated,
    insertions: change.insertions,
    deletions: change.deletions,
    owner: change.owner.name ?? '',
  }));

  return JSON.stringify(changes);
};
