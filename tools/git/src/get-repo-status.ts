import type {OpenAITool} from '@ai/openai-session';
import {execGit} from './git-helpers.js';

export interface GetRepoStatusParams {
  repoPath: string;
}

export const getRepoStatus: OpenAITool<GetRepoStatusParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'get_repo_status',
      description: `Get the current repository status including branch, remote tracking info, and file changes.

Returns: Raw git status output as string, showing current branch, tracking info, staged/unstaged changes, and untracked files.`,
      parameters: {
        type: 'object',
        properties: {
          repoPath: {
            type: 'string',
            description: 'Absolute path to the git repository.',
          },
        },
        required: ['repoPath'],
      },
    },
  },
  handler: async (args) => {
    const status = await execGit(args.repoPath, ['status']);
    return status;
  },
};
