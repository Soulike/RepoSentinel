import type {OpenAITool} from '@ai/openai-session';
import {createOctokit, type GitHubBaseParams} from './github-helpers.js';

export type GetRepoStatusParams = GitHubBaseParams;

export const getRepoStatus: OpenAITool<GetRepoStatusParams> = {
  definition: {
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
  },
  handler: async (args) => {
    const octokit = createOctokit(args.token);

    const {data} = await octokit.repos.get({
      owner: args.owner,
      repo: args.repo,
    });

    // Extract only essential fields to match git tool output simplicity
    return JSON.stringify({
      name: data.name,
      fullName: data.full_name,
      defaultBranch: data.default_branch,
      visibility: data.visibility,
      description: data.description,
      language: data.language,
      updatedAt: data.updated_at,
      pushedAt: data.pushed_at,
    });
  },
};
