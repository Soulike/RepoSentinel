import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../../ai/tool-registry.js';
import {GitHubClient, isGitHubError} from '../../helpers/github-client.js';

interface GitHubGetCommitDetailsParams {
  owner: string;
  repo: string;
  commitHash: string;
  path?: string;
  token?: string;
}

interface GitHubCommitDetailResponse {
  sha: string;
  commit: {
    author: {
      name: string;
      date: string;
    };
    message: string;
  };
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
  }>;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_commit_details',
    description: `Get detailed information about a specific commit from GitHub, including the list of changed files.

Returns: JSON object with:
- hash: Full commit hash
- author: Commit author name
- date: ISO 8601 timestamp
- message: Full commit message
- files: Array of changed files, each with path, status (added/modified/deleted/renamed), additions, deletions`,
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
        commitHash: {
          type: 'string',
          description: 'The commit hash to inspect (full or short)',
        },
        path: {
          type: 'string',
          description:
            'Filter to only include files under this path (optional)',
        },
        token: {
          type: 'string',
          description: 'GitHub personal access token (optional)',
        },
      },
      required: ['owner', 'repo', 'commitHash'],
    },
  },
};

export const handler: ToolFunction<GitHubGetCommitDetailsParams> = async (
  params,
) => {
  const client = new GitHubClient({token: params.token});

  const result = await client.get<GitHubCommitDetailResponse>(
    `/repos/${params.owner}/${params.repo}/commits/${params.commitHash}`,
  );

  if (isGitHubError(result)) {
    return JSON.stringify(result);
  }

  let files = result.files.map((file) => ({
    path: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
  }));

  // Filter by path if specified
  if (params.path) {
    files = files.filter((file) => file.path.startsWith(params.path!));
  }

  return JSON.stringify({
    hash: result.sha,
    author: result.commit.author.name,
    date: result.commit.author.date,
    message: result.commit.message,
    files,
  });
};
