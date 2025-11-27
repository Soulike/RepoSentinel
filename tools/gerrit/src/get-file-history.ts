import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {
  gerritFetch,
  buildUrl,
  type GerritBaseParams,
} from './gerrit-helpers.js';

export interface GetFileHistoryParams extends GerritBaseParams {
  filePath: string;
  limit?: number;
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
  _number: number;
  owner: {name?: string};
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'gerrit_get_file_history',
    description: `Get the history of changes affecting a specific file.

Returns: JSON array of changes that modified the file.`,
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
        filePath: {
          type: 'string',
          description: 'Path to the file within the repository.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of changes to return. Defaults to 25.',
        },
      },
      required: ['host', 'project', 'filePath'],
    },
  },
};

export const handler: ToolFunction<GetFileHistoryParams> = async (args) => {
  const limit = args.limit ?? 25;

  const query = `project:${args.project}+status:merged+path:${args.filePath}`;

  const url = buildUrl(args.host, '/changes/', {
    q: query,
    n: String(limit),
  });

  const data = await gerritFetch<ChangeInfo[]>(url);

  const changes = data.map((change) => ({
    number: change._number,
    changeId: change.change_id,
    subject: change.subject,
    status: change.status,
    branch: change.branch,
    updated: change.updated,
    owner: change.owner.name ?? '',
  }));

  return JSON.stringify(changes);
};
