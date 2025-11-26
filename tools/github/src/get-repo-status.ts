import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {createOctokit, type GitHubBaseParams} from './github-helpers.js';

export type GetRepoStatusParams = GitHubBaseParams;

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_repo_status',
    description: `Get repository information including default branch, visibility, and recent activity.

Returns: JSON object with repository details from GitHub API.`,
    parameters: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner (username or organization).',
        },
        repo: {
          type: 'string',
          description: 'Repository name.',
        },
        token: {
          type: 'string',
          description:
            'Optional GitHub token for private repos or higher rate limits.',
        },
      },
      required: ['owner', 'repo'],
    },
  },
};

export const handler: ToolFunction<GetRepoStatusParams> = async (args) => {
  const octokit = createOctokit(args.token);

  const {data} = await octokit.repos.get({
    owner: args.owner,
    repo: args.repo,
  });

  return JSON.stringify(data);
};
