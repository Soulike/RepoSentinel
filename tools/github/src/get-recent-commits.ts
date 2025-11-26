import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {createOctokit, type GitHubBaseParams} from './github-helpers.js';

export interface Commit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
}

export interface GetRecentCommitsParams extends GitHubBaseParams {
  branch: string;
  hours: number;
  path?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_recent_commits',
    description: `Get recent commits from a branch within the last N hours.

Returns: JSON array of commit objects with hash, shortHash, author, date (ISO 8601), and message.`,
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
        token: {
          type: 'string',
          description:
            'Optional GitHub token for private repos or higher rate limits.',
        },
      },
      required: ['owner', 'repo', 'branch', 'hours'],
    },
  },
};

export const handler: ToolFunction<GetRecentCommitsParams> = async (args) => {
  const octokit = createOctokit(args.token);

  const since = new Date(
    Date.now() - args.hours * 60 * 60 * 1000,
  ).toISOString();

  const {data: commits} = await octokit.repos.listCommits({
    owner: args.owner,
    repo: args.repo,
    sha: args.branch,
    since,
    per_page: 100,
    ...(args.path && {path: args.path}),
  });

  const result: Commit[] = commits.map((c) => ({
    hash: c.sha,
    shortHash: c.sha.slice(0, 7),
    author: c.commit.author?.name ?? 'Unknown',
    date: c.commit.author?.date ?? '',
    message: c.commit.message.split('\n')[0] ?? '',
  }));

  return JSON.stringify(result);
};
