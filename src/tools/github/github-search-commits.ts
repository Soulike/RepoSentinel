import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../../ai/tool-registry.js';
import {GitHubClient, isGitHubError} from '../../helpers/github-client.js';

interface GitHubSearchCommitsParams {
  owner: string;
  repo: string;
  query: string;
  maxResults?: number;
  token?: string;
}

interface GitHubSearchCommitsResponse {
  items: Array<{
    sha: string;
    commit: {
      author: {
        name: string;
        date: string;
      };
      message: string;
    };
  }>;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_search_commits',
    description: `Search for commits by message keyword in a GitHub repository.

Returns: JSON array of matching commit objects with:
- hash: Full commit hash
- shortHash: Abbreviated 7-char hash
- author: Commit author name
- date: ISO 8601 timestamp
- message: Commit message (first line)`,
    parameters: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner (user or organization)',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        query: {
          type: 'string',
          description: 'Keyword or phrase to search for in commit messages',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 30)',
        },
        token: {
          type: 'string',
          description:
            'GitHub personal access token (optional, but recommended for search API)',
        },
      },
      required: ['owner', 'repo', 'query'],
    },
  },
};

export const handler: ToolFunction<GitHubSearchCommitsParams> = async (
  params,
) => {
  const client = new GitHubClient({token: params.token});

  const perPage = params.maxResults ?? 30;
  const q = `${params.query} repo:${params.owner}/${params.repo}`;

  const result = await client.get<GitHubSearchCommitsResponse>(
    '/search/commits',
    {
      q,
      per_page: String(perPage),
    },
  );

  if (isGitHubError(result)) {
    return JSON.stringify(result);
  }

  const commits = result.items.map((item) => ({
    hash: item.sha,
    shortHash: item.sha.substring(0, 7),
    author: item.commit.author.name,
    date: item.commit.author.date,
    message: item.commit.message.split('\n')[0],
  }));

  return JSON.stringify(commits);
};
