import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {gerritFetch, buildUrl} from './helpers/fetch.js';

export interface GetChangeDetailsParams {
  host: string;
  changeId: string;
}

interface RevisionInfo {
  _number: number;
  commit?: {
    subject: string;
    message: string;
    author: {name: string; email: string; date: string};
    committer: {name: string; email: string; date: string};
  };
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
  owner: {name?: string; email?: string};
  current_revision?: string;
  revisions?: Record<string, RevisionInfo>;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'gerrit_get_change_details',
    description: `Get detailed information about a specific Gerrit change.

Returns: JSON object with change details including commit info.`,
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
      },
      required: ['host', 'changeId'],
    },
  },
};

export const handler: ToolFunction<GetChangeDetailsParams> = async (args) => {
  const url = buildUrl(args.host, `/changes/${args.changeId}`, {
    o: ['CURRENT_REVISION', 'CURRENT_COMMIT'],
  });

  const data = await gerritFetch<ChangeInfo>(url);

  const currentRevision = data.current_revision;
  const revision = currentRevision ? data.revisions?.[currentRevision] : null;
  const commit = revision?.commit;

  return JSON.stringify({
    number: data._number,
    changeId: data.change_id,
    project: data.project,
    branch: data.branch,
    subject: data.subject,
    status: data.status,
    created: data.created,
    updated: data.updated,
    insertions: data.insertions,
    deletions: data.deletions,
    owner: {
      name: data.owner.name ?? '',
      email: data.owner.email ?? '',
    },
    currentRevision: currentRevision ?? null,
    commit: commit
      ? {
          subject: commit.subject,
          message: commit.message,
          author: commit.author,
          committer: commit.committer,
        }
      : null,
  });
};
