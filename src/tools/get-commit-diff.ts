import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../ai/tool-registry.js';
import {execGit} from '../helpers/git-helpers.js';

export interface GetCommitDiffParams {
  commitHash: string;
  filePath?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'get_commit_diff',
    description:
      'Get the diff content for a specific commit. Optionally limit to a specific file.',
    parameters: {
      type: 'object',
      properties: {
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
      required: ['commitHash'],
    },
  },
};

export const handler: ToolFunction<GetCommitDiffParams> = async (args) => {
  const {commitHash, filePath} = args;

  const gitArgs = ['show', commitHash, '--patch', '--pretty=format:'];

  if (filePath) {
    gitArgs.push('--', filePath);
  }

  const diff = await execGit(gitArgs);

  return diff || '(no diff content)';
};
