import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {execGit} from './git-helpers.js';

export interface GetFileContentParams {
  repoPath: string;
  commitHash: string;
  filePath: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'get_file_content',
    description: `Read the content of a file at a specific commit. Use "HEAD" for the current version.

Returns: Raw file content as string.`,
    parameters: {
      type: 'object',
      properties: {
        repoPath: {
          type: 'string',
          description: 'Absolute path to the git repository.',
        },
        commitHash: {
          type: 'string',
          description:
            'The commit hash to read the file from. Use "HEAD" for the current version.',
        },
        filePath: {
          type: 'string',
          description: 'Path to the file relative to the repository root.',
        },
      },
      required: ['repoPath', 'commitHash', 'filePath'],
    },
  },
};

export const handler: ToolFunction<GetFileContentParams> = async (args) => {
  const {repoPath, commitHash, filePath} = args;

  const content = await execGit(repoPath, [
    'show',
    `${commitHash}:${filePath}`,
  ]);

  return content;
};
