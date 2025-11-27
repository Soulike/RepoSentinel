import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {
  gerritFetch,
  buildUrl,
  buildGerritQuery,
  formatGerritTimestamp,
  type GerritBaseParams,
} from './gerrit-helpers.js';

export interface GetFileChangesParams extends GerritBaseParams {
  branch: string;
  hours: number;
  file: string;
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
        file: {
          type: 'string',
          description: 'File path to filter changes by (e.g., src/main.ts).',
        },
      },
      required: ['host', 'project', 'branch', 'hours', 'file'],
    },
  },
};

export const handler: ToolFunction<GetFileChangesParams> = async (args) => {
  const since = new Date(Date.now() - args.hours * 60 * 60 * 1000);

  const query = buildGerritQuery({
    project: args.project,
    status: 'merged',
    branch: args.branch,
    after: formatGerritTimestamp(since),
    file: args.file,
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
