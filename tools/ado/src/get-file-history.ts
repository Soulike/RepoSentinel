import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import type {GitQueryCommitsCriteria} from 'azure-devops-node-api/interfaces/GitInterfaces.js';
import {createGitClient, type AdoBaseParams} from './helpers/client.js';

export interface GetFileHistoryParams extends AdoBaseParams {
  filePath: string;
  limit?: number;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'ado_get_file_history',
    description: `Get commit history for a specific file.

Returns: JSON array of commits that modified the specified file.`,
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
        filePath: {
          type: 'string',
          description: 'Path to the file within the repository.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of commits to return. Defaults to 20.',
        },
      },
      required: ['organization', 'project', 'repository', 'token', 'filePath'],
    },
  },
};

export const handler: ToolFunction<GetFileHistoryParams> = async (args) => {
  const gitApi = await createGitClient(args.organization, args.token);
  const limit = args.limit ?? 20;

  const searchCriteria: GitQueryCommitsCriteria = {
    itemPath: args.filePath,
    $top: limit,
  };

  const commits = await gitApi.getCommits(
    args.repository,
    searchCriteria,
    args.project,
  );

  const result = commits.map((commit) => ({
    hash: commit.commitId,
    shortHash: commit.commitId?.slice(0, 7),
    author: commit.author?.name,
    date: commit.author?.date,
    message: commit.comment?.split('\n')[0] ?? '',
  }));

  return JSON.stringify(result);
};
