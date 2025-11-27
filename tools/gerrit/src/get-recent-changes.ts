import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {
  gerritFetch,
  buildUrl,
  type GerritBaseParams,
} from './gerrit-helpers.js';

export interface GetRecentChangesParams extends GerritBaseParams {
  branch?: string;
  status?: string;
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
  insertions: number;
  deletions: number;
  _number: number;
  owner: {name?: string};
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'gerrit_get_recent_changes',
    description: `Get recent changes (code reviews) from a Gerrit project.

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
          description: 'Optional branch name to filter by.',
        },
        status: {
          type: 'string',
          description:
            'Optional status filter (open, merged, abandoned). Defaults to merged.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of changes to return. Defaults to 25.',
        },
      },
      required: ['host', 'project'],
    },
  },
};

export const handler: ToolFunction<GetRecentChangesParams> = async (args) => {
  const status = args.status ?? 'merged';
  const limit = args.limit ?? 25;

  let query = `project:${args.project}+status:${status}`;
  if (args.branch) {
    query += `+branch:${args.branch}`;
  }

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
    created: change.created,
    updated: change.updated,
    insertions: change.insertions,
    deletions: change.deletions,
    owner: change.owner.name ?? '',
  }));

  return JSON.stringify(changes);
};
