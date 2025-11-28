import type {OpenAITool} from '@ai/openai-session';
import {isBinary} from '@helpers/binary-utils';
import {execGit} from './git-helpers.js';

export interface GetFileContentParams {
  repoPath: string;
  commitHash: string;
  filePath: string;
}

export const getFileContent: OpenAITool<GetFileContentParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'get_file_content',
      description: `Read the content of a text file at a specific commit. Use "HEAD" for the current version.

Returns: File content as string. Returns an error for binary files.`,
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
  },
  handler: async (args) => {
    const {repoPath, commitHash, filePath} = args;

    const content = await execGit(repoPath, [
      'show',
      `${commitHash}:${filePath}`,
    ]);

    if (isBinary(content)) {
      return JSON.stringify({
        error: 'File is binary',
        path: filePath,
        commitHash,
      });
    }

    return content;
  },
};
