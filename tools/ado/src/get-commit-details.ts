import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {
  changeTypeToString,
  createGitClient,
  type AdoBaseParams,
} from './helpers/client.js';

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
  const gitApi = await createGitClient(args.organization, args.token);

  const commit = await gitApi.getCommit(
    args.commitId,
    args.repository,
    args.project,
    1000, // changeCount
  );

  const changes = await gitApi.getChanges(
    args.commitId,
    args.repository,
    args.project,
  );

  const files = (changes.changes ?? []).map((change) => ({
    path: change.item?.path,
    status: change.changeType
      ? changeTypeToString(change.changeType)
      : 'unknown',
  }));

  return JSON.stringify({
    hash: commit.commitId,
    author: commit.author?.name,
    date: commit.author?.date,
    message: commit.comment,
    parents: commit.parents ?? [],
    files,
  });
};
