import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../../ai/tool-registry.js';
import {GitHubClient, isGitHubError} from '../../helpers/github-client.js';

interface GitHubGetFileHistoryParams {
  owner: string;
  repo: string;
  filePath: string;
  maxCount?: number;
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
    name: 'github_get_file_history',
    description: `Get the commit history for a specific file from GitHub.

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
        filePath: {
          type: 'string',
          description: 'Path to the file relative to the repository root',
        },
        maxCount: {
          type: 'number',
          description: 'Maximum number of commits to return (default: 10)',
        },
        token: {
          type: 'string',
          description: 'GitHub personal access token (optional)',
        },
      },
      required: ['owner', 'repo', 'filePath'],
    },
  },
};

export const handler: ToolFunction<GitHubGetFileHistoryParams> = async (
  params,
) => {
  const client = new GitHubClient({token: params.token});

  const perPage = params.maxCount ?? 10;

  const result = await client.get<GitHubCommitResponse[]>(
    `/repos/${params.owner}/${params.repo}/commits`,
    {
      path: params.filePath,
      per_page: String(perPage),
    },
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
