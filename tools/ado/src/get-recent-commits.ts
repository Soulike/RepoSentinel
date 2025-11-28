import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import type {GitQueryCommitsCriteria} from 'azure-devops-node-api/interfaces/GitInterfaces.js';
import {createGitClient, type AdoBaseParams} from './helpers/client.js';

export interface GetRecentCommitsParams extends AdoBaseParams {
  branch: string;
  hours: number;
  path?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'ado_get_recent_commits',
    description: `Get recent commits from an Azure DevOps repository branch within the last N hours.

Returns: JSON array of commit objects with hash, author, date, and message.`,
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
        branch: {
          type: 'string',
          description: 'Branch name to get commits from.',
        },
        hours: {
          type: 'number',
          description: 'Number of hours to look back for commits.',
        },
        path: {
          type: 'string',
          description: 'Optional file path to filter commits by.',
        },
      },
      required: [
        'organization',
        'project',
        'repository',
        'token',
        'branch',
        'hours',
      ],
    },
  },
};

export const handler: ToolFunction<GetRecentCommitsParams> = async (args) => {
  const gitApi = await createGitClient(args.organization, args.token);

  const since = new Date(Date.now() - args.hours * 60 * 60 * 1000);

  const searchCriteria: GitQueryCommitsCriteria = {
    itemVersion: {version: args.branch},
    fromDate: since.toISOString(),
    $top: 100,
  };

  if (args.path) {
    searchCriteria.itemPath = args.path;
  }

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
