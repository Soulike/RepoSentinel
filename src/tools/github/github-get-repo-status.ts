import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../../ai/tool-registry.js';
import {GitHubClient, isGitHubError} from '../../helpers/github-client.js';

interface GitHubRepoStatusParams {
  owner: string;
  repo: string;
  token?: string;
}

interface GitHubRepoResponse {
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  visibility: string;
  language: string | null;
  updated_at: string;
  pushed_at: string;
  open_issues_count: number;
  stargazers_count: number;
  forks_count: number;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_repo_status',
    description: `Get repository information from GitHub API.

Returns: JSON object with:
- name: Repository name
- fullName: Full repository name (owner/repo)
- description: Repository description
- defaultBranch: Default branch name
- visibility: "public" or "private"
- language: Primary programming language
- updatedAt: Last update timestamp
- pushedAt: Last push timestamp
- openIssuesCount: Number of open issues
- starsCount: Number of stars
- forksCount: Number of forks`,
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
        token: {
          type: 'string',
          description:
            'GitHub personal access token (optional, for private repos or higher rate limits)',
        },
      },
      required: ['owner', 'repo'],
    },
  },
};

export const handler: ToolFunction<GitHubRepoStatusParams> = async (params) => {
  const client = new GitHubClient({token: params.token});
  const result = await client.get<GitHubRepoResponse>(
    `/repos/${params.owner}/${params.repo}`,
  );

  if (isGitHubError(result)) {
    return JSON.stringify(result);
  }

  return JSON.stringify({
    name: result.name,
    fullName: result.full_name,
    description: result.description,
    defaultBranch: result.default_branch,
    visibility: result.visibility,
    language: result.language,
    updatedAt: result.updated_at,
    pushedAt: result.pushed_at,
    openIssuesCount: result.open_issues_count,
    starsCount: result.stargazers_count,
    forksCount: result.forks_count,
  });
};
