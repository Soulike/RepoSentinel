import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {adoFetch, repoBasePath} from './helpers/fetch.js';
import type {AdoBaseParams, AdoCommitsResponse} from './helpers/types.js';

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
  const since = new Date(
    Date.now() - args.hours * 60 * 60 * 1000,
  ).toISOString();

  const basePath = repoBasePath(args.project, args.repository);
  const params: Record<string, string> = {
    'searchCriteria.itemVersion.version': args.branch,
    'searchCriteria.fromDate': since,
    $top: '100',
  };

  if (args.path) {
    params['searchCriteria.itemPath'] = args.path;
  }

  const data = await adoFetch<AdoCommitsResponse>(
    args.organization,
    `${basePath}/commits`,
    args.token,
    params,
  );

  const commits = data.value.map((commit) => ({
    hash: commit.commitId,
    shortHash: commit.commitId.slice(0, 7),
    author: commit.author.name,
    date: commit.author.date,
    message: commit.comment.split('\n')[0] ?? '',
  }));

  return JSON.stringify(commits);
};
