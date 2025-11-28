import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {adoFetch, repoBasePath} from './helpers/fetch.js';
import type {AdoBaseParams, AdoCommitDetails} from './helpers/types.js';

export interface GetCommitDetailsParams extends AdoBaseParams {
  commitId: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'ado_get_commit_details',
    description: `Get detailed information about a specific commit including changed files.

Returns: JSON object with commit details and files array showing paths and change types.`,
    parameters: {
      type: 'object',
      properties: {
        organization: {
          type: 'string',
          description: 'Azure DevOps organization name.',
        },
        project: {
          type: 'string',
          description: 'Azure DevOps project name.',
        },
        repository: {
          type: 'string',
          description: 'Repository name or ID.',
        },
        token: {
          type: 'string',
          description: 'Bearer token for authentication.',
        },
        commitId: {
          type: 'string',
          description: 'Full or abbreviated commit SHA.',
        },
      },
      required: ['organization', 'project', 'repository', 'token', 'commitId'],
    },
  },
};

export const handler: ToolFunction<GetCommitDetailsParams> = async (args) => {
  const basePath = repoBasePath(args.project, args.repository);

  const data = await adoFetch<AdoCommitDetails>(
    args.organization,
    `${basePath}/commits/${args.commitId}`,
    args.token,
    {changeCount: '1000'},
  );

  const files = (data.changes ?? []).map((change) => ({
    path: change.item.path,
    status: change.changeType,
  }));

  return JSON.stringify({
    hash: data.commitId,
    author: data.author.name,
    date: data.author.date,
    message: data.comment,
    parents: data.parents ?? [],
    files,
  });
};
