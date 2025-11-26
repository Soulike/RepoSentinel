import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../../ai/tool-registry.js';
import {GitHubClient, isGitHubError} from '../../helpers/github-client.js';

interface GitHubGetRecentCommitsParams {
  owner: string;
  repo: string;
  branch?: string;
  hours: number;
  path?: string;
  token?: string;
}

interface GitHubCommitResponse {
  sha: string;
  commit: {
    author: {
      name: string;
      date: string;
    };
    message: string;
  };
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_recent_commits',
    description: `Get commits from the last N hours on a specified branch from GitHub.

Returns: JSON array of commit objects with:
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
        branch: {
          type: 'string',
          description: 'Branch name (defaults to default branch)',
        },
        hours: {
          type: 'number',
          description: 'Number of hours to look back',
        },
        path: {
          type: 'string',
          description: 'Filter commits by file path (optional)',
        },
        token: {
          type: 'string',
          description: 'GitHub personal access token (optional)',
        },
      },
      required: ['owner', 'repo', 'hours'],
    },
  },
};

export const handler: ToolFunction<GitHubGetRecentCommitsParams> = async (
  params,
) => {
  const client = new GitHubClient({token: params.token});

  const since = new Date(
    Date.now() - params.hours * 60 * 60 * 1000,
  ).toISOString();

  const queryParams: Record<string, string> = {
    since,
    per_page: '100',
  };

  if (params.branch) {
    queryParams['sha'] = params.branch;
  }

  if (params.path) {
    queryParams['path'] = params.path;
  }

  const result = await client.get<GitHubCommitResponse[]>(
    `/repos/${params.owner}/${params.repo}/commits`,
    queryParams,
  );

  if (isGitHubError(result)) {
    return JSON.stringify(result);
  }

  const commits = result.map((commit) => ({
    hash: commit.sha,
    shortHash: commit.sha.substring(0, 7),
    author: commit.commit.author.name,
    date: commit.commit.author.date,
    message: commit.commit.message.split('\n')[0],
  }));

  return JSON.stringify(commits);
};
