import type {OpenAITool} from '@ai/openai-session';
import {createOctokit, type GitHubBaseParams} from './github-helpers.js';

export interface GetFileHistoryParams extends GitHubBaseParams {
  filePath: string;
  maxCount?: number;
  ref?: string;
}

export const getFileHistory: OpenAITool<GetFileHistoryParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'github_get_file_history',
      description: `Get the commit history for a specific file.

Returns: JSON array of commit objects from GitHub API.`,
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
          filePath: {
            type: 'string',
            description: 'Path to the file within the repository.',
          },
          maxCount: {
            type: 'number',
            description: 'Maximum number of commits to return. Defaults to 10.',
          },
          ref: {
            type: 'string',
            description: 'Branch or commit to start history from.',
          },
          token: {
            type: 'string',
            description:
              'Optional GitHub token for private repos or higher rate limits.',
          },
        },
        required: ['owner', 'repo', 'filePath'],
      },
    },
  },
  handler: async (args) => {
    const octokit = createOctokit(args.token);

    const {data} = await octokit.repos.listCommits({
      owner: args.owner,
      repo: args.repo,
      path: args.filePath,
      per_page: args.maxCount ?? 10,
      ...(args.ref && {sha: args.ref}),
    });

    // Extract only essential fields to match git tool output
    const commits = data.map((commit) => ({
      hash: commit.sha,
      shortHash: commit.sha.slice(0, 7),
      author: commit.commit.author?.name ?? '',
      date: commit.commit.author?.date ?? '',
      // First line only (subject) to match git's %s format
      message: commit.commit.message.split('\n')[0] ?? '',
    }));

    return JSON.stringify(commits);
  },
};
