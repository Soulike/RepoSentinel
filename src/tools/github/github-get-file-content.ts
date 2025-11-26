import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../../ai/tool-registry.js';
import {GitHubClient, isGitHubError} from '../../helpers/github-client.js';

interface GitHubGetFileContentParams {
  owner: string;
  repo: string;
  filePath: string;
  ref?: string;
  token?: string;
}

interface GitHubContentResponse {
  type: string;
  content: string;
  encoding: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_file_content',
    description: `Read the content of a file from GitHub at a specific ref (branch, tag, or commit).

Returns: Raw file content as string.`,
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
        ref: {
          type: 'string',
          description:
            'Branch, tag, or commit SHA (defaults to default branch)',
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

export const handler: ToolFunction<GitHubGetFileContentParams> = async (
  params,
) => {
  const client = new GitHubClient({token: params.token});

  const queryParams: Record<string, string> = {};
  if (params.ref) {
    queryParams['ref'] = params.ref;
  }

  const result = await client.get<GitHubContentResponse>(
    `/repos/${params.owner}/${params.repo}/contents/${params.filePath}`,
    queryParams,
  );

  if (isGitHubError(result)) {
    return JSON.stringify(result);
  }

  if (result.type !== 'file') {
    return JSON.stringify({
      error: true,
      message: `Path is not a file, it is a ${result.type}`,
    });
  }

  // Decode base64 content
  const content = Buffer.from(result.content, 'base64').toString('utf-8');
  return content;
};
