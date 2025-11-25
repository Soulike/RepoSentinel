import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../ai/tool-registry.js';
import {execGit} from '../helpers/git-helpers.js';

export interface GetFileContentParams {
  commitHash: string;
  filePath: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'get_file_content',
    description:
      'Read the content of a file at a specific commit. Use "HEAD" for the current version.',
    parameters: {
      type: 'object',
      properties: {
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
      required: ['commitHash', 'filePath'],
    },
  },
};

export const handler: ToolFunction<GetFileContentParams> = async (args) => {
  const {commitHash, filePath} = args;

  const content = await execGit(['show', `${commitHash}:${filePath}`]);

  return content;
};
