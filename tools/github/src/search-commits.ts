import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {createOctokit, type GitHubBaseParams} from './github-helpers.js';

export interface SearchCommit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
}

export interface SearchCommitsParams extends GitHubBaseParams {
  query: string;
  branch?: string;
  hours?: number;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_search_commits',
    description: `Search for commits by message keyword in a repository.

Returns: JSON array of matching commits with hash, shortHash, author, date (ISO 8601), and message.`,
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
        query: {
          type: 'string',
          description: 'Search keyword to match in commit messages.',
        },
        branch: {
          type: 'string',
          description: 'Optional branch to limit search to.',
        },
        hours: {
          type: 'number',
          description: 'Optional number of hours to look back.',
        },
        token: {
          type: 'string',
          description:
            'Optional GitHub token for private repos or higher rate limits.',
        },
      },
      required: ['owner', 'repo', 'query'],
    },
  },
};

export const handler: ToolFunction<SearchCommitsParams> = async (args) => {
  const octokit = createOctokit(args.token);

  // Build search query
  const q = `repo:${args.owner}/${args.repo} ${args.query}`;

  // GitHub Search API doesn't support time filtering directly,
  // so we fetch more results and filter client-side if hours is specified
  const {data} = await octokit.search.commits({
    q,
    sort: 'committer-date',
    order: 'desc',
    per_page: 100,
  });

  let commits = data.items;

  // Filter by time if hours is specified
  if (args.hours) {
    const since = Date.now() - args.hours * 60 * 60 * 1000;
    commits = commits.filter((c) => {
      const commitDate = new Date(c.commit.author?.date ?? 0).getTime();
      return commitDate >= since;
    });
  }

  const result: SearchCommit[] = commits.map((c) => ({
    hash: c.sha,
    shortHash: c.sha.slice(0, 7),
    author: c.commit.author?.name ?? 'Unknown',
    date: c.commit.author?.date ?? '',
    message: c.commit.message.split('\n')[0] ?? '',
  }));

  return JSON.stringify(result);
};
