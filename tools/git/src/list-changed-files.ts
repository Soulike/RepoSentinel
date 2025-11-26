import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {execGit} from './git-helpers.js';

export interface ListChangedFilesParams {
  repoPath: string;
  branch: string;
  hours: number;
  path?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'list_changed_files',
    description: `List all unique files that were changed in commits within the specified time window.

Returns: JSON array of file path strings.`,
    parameters: {
      type: 'object',
      properties: {
        repoPath: {
          type: 'string',
          description: 'Absolute path to the git repository.',
        },
        branch: {
          type: 'string',
          description: 'Branch name to check for changed files.',
        },
        hours: {
          type: 'number',
          description: 'Number of hours to look back.',
        },
        path: {
          type: 'string',
          description:
            'Optional path to filter. Only files under this path will be returned.',
        },
      },
      required: ['repoPath', 'branch', 'hours'],
    },
  },
};

export const handler: ToolFunction<ListChangedFilesParams> = async (args) => {
  const {repoPath, branch, hours, path} = args;
  const since = `${hours} hours ago`;

  const gitArgs = [
    'log',
    branch,
    `--since="${since}"`,
    '--name-only',
    '--pretty=format:',
  ];

  if (path) {
    gitArgs.push('--', path);
  }

  const output = await execGit(repoPath, gitArgs);

  if (!output) {
    return JSON.stringify([]);
  }

  const files = [
    ...new Set(
      output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== ''),
    ),
  ];

  return JSON.stringify(files);
};
