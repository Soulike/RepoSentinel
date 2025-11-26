import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../../ai/tool-registry.js';
import {GitHubClient, isGitHubError} from '../../helpers/github-client.js';

interface GitHubListChangedFilesParams {
  owner: string;
  repo: string;
  base: string;
  head: string;
  token?: string;
}

interface GitHubCompareResponse {
  files: Array<{
    filename: string;
    status: string;
  }>;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_list_changed_files',
    description: `List all files changed between two refs (branches, tags, or commits) from GitHub.

Returns: JSON array of file objects with:
- path: File path
- status: Change status (added, modified, deleted, renamed)`,
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
        base: {
          type: 'string',
          description: 'Base ref (branch, tag, or commit SHA)',
        },
        head: {
          type: 'string',
          description: 'Head ref to compare against base',
        },
        token: {
          type: 'string',
          description: 'GitHub personal access token (optional)',
        },
      },
      required: ['owner', 'repo', 'base', 'head'],
    },
  },
};

export const handler: ToolFunction<GitHubListChangedFilesParams> = async (
  params,
) => {
  const client = new GitHubClient({token: params.token});

  const result = await client.get<GitHubCompareResponse>(
    `/repos/${params.owner}/${params.repo}/compare/${params.base}...${params.head}`,
  );

  if (isGitHubError(result)) {
    return JSON.stringify(result);
  }

  const files = result.files.map((file) => ({
    path: file.filename,
    status: file.status,
  }));

  return JSON.stringify(files);
};
