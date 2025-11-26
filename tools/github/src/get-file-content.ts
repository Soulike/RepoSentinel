import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {createOctokit, type GitHubBaseParams} from './github-helpers.js';

export interface GetFileContentParams extends GitHubBaseParams {
  filePath: string;
  ref?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_file_content',
    description: `Get the content of a file at a specific commit or branch.

Returns: The raw file content as a string.`,
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
        ref: {
          type: 'string',
          description:
            'Commit SHA, branch name, or tag. Defaults to the default branch.',
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
};

export const handler: ToolFunction<GetFileContentParams> = async (args) => {
  const octokit = createOctokit(args.token);

  const {data} = await octokit.repos.getContent({
    owner: args.owner,
    repo: args.repo,
    path: args.filePath,
    ...(args.ref && {ref: args.ref}),
  });

  // getContent can return file or directory; we expect a file
  if (Array.isArray(data)) {
    return JSON.stringify({
      error: 'Path is a directory, not a file',
      contents: data.map((item) => item.name),
    });
  }

  if (data.type !== 'file' || !('content' in data)) {
    return JSON.stringify({error: 'Path is not a file', type: data.type});
  }

  // Content is base64 encoded
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return content;
};
