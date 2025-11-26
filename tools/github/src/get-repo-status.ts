import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {createOctokit, type GitHubBaseParams} from './github-helpers.js';

export type GetRepoStatusParams = GitHubBaseParams;

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_repo_status',
    description: `Get repository information including default branch, visibility, and recent activity.

Returns: JSON with repository name, default branch, visibility, branch list, and last updated timestamp.`,
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

  const [{data: repo}, {data: branches}] = await Promise.all([
    octokit.repos.get({owner: args.owner, repo: args.repo}),
    octokit.repos.listBranches({
      owner: args.owner,
      repo: args.repo,
      per_page: 20,
    }),
  ]);

  return JSON.stringify({
    name: repo.full_name,
    defaultBranch: repo.default_branch,
    visibility: repo.visibility,
    branches: branches.map((b) => b.name),
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
  });
};
