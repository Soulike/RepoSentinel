import type {OpenAITool} from '@ai/openai-session';
import {createOctokit, type GitHubBaseParams} from './github-helpers.js';

export interface GetCommitDetailsParams extends GitHubBaseParams {
  commitHash: string;
}

export const getCommitDetails: OpenAITool<GetCommitDetailsParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'github_get_commit_details',
      description: `Get detailed information about a specific commit including changed files.

Returns: JSON commit object from GitHub API with full details and files array.`,
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
          commitHash: {
            type: 'string',
            description: 'Full or abbreviated commit SHA.',
          },
          token: {
            type: 'string',
            description:
              'Optional GitHub token for private repos or higher rate limits.',
          },
        },
        required: ['owner', 'repo', 'commitHash'],
      },
    },
  },
  handler: async (args) => {
    const octokit = createOctokit(args.token);

    const {data} = await octokit.repos.getCommit({
      owner: args.owner,
      repo: args.repo,
      ref: args.commitHash,
    });

    const files = (data.files ?? [])
      .filter((file) => file.status !== 'unchanged')
      .map((file) => ({
        path: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
      }));

    const result = {
      hash: data.sha,
      author: data.commit.author?.name ?? '',
      date: data.commit.author?.date ?? '',
      message: data.commit.message,
      files,
    };

    return JSON.stringify(result);
  },
};
