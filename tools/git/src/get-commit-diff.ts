import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {execGit} from './git-helpers.js';

export interface GetCommitDiffParams {
  repoPath: string;
  commitHash: string;
  filePath?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'get_commit_diff',
    description: `Get the diff content for a specific commit. Optionally limit to a specific file.

Returns: Unified diff format string showing added (+) and removed (-) lines, or "(no diff content)" if empty.`,
    parameters: {
      type: 'object',
      properties: {
        repoPath: {
          type: 'string',
          description: 'Absolute path to the git repository.',
        },
        commitHash: {
          type: 'string',
          description: 'The commit hash to get the diff for.',
        },
        filePath: {
          type: 'string',
          description:
            'Optional file path to limit the diff to a specific file.',
        },
      },
      required: ['repoPath', 'commitHash'],
    },
  },
};

export const handler: ToolFunction<GetCommitDiffParams> = async (args) => {
  const {repoPath, commitHash, filePath} = args;

  const gitArgs = ['show', commitHash, '--patch', '--pretty=format:'];

  if (filePath) {
    gitArgs.push('--', filePath);
  }

  const diff = await execGit(repoPath, gitArgs);

  return diff || '(no diff content)';
};
