import type {OpenAITool} from '@ai/openai-session';
import {execGit} from './git-helpers.js';

export interface FileHistoryCommit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
}

export interface GetFileHistoryParams {
  repoPath: string;
  filePath: string;
  maxCount?: number;
}

export const getFileHistory: OpenAITool<GetFileHistoryParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'get_file_history',
      description: `Get the commit history for a specific file. Useful for understanding how a file has evolved over time.

Returns: JSON array of commit objects with:
- hash: Full commit hash
- shortHash: Abbreviated 7-char hash
- author: Commit author name
- date: ISO 8601 timestamp
- message: Commit message subject line`,
      parameters: {
        type: 'object',
        properties: {
          repoPath: {
            type: 'string',
            description: 'Absolute path to the git repository.',
          },
          filePath: {
            type: 'string',
            description: 'Path to the file relative to the repository root.',
          },
          maxCount: {
            type: 'number',
            description: 'Maximum number of commits to return. Defaults to 10.',
          },
        },
        required: ['repoPath', 'filePath'],
      },
    },
  },
  handler: async (args) => {
    const {repoPath, filePath, maxCount = 10} = args;

    // Format: hash|shortHash|author|date|message
    const format = '%H|%h|%an|%aI|%s';

    const output = await execGit(repoPath, [
      'log',
      `-n`,
      `${maxCount}`,
      `--pretty=format:${format}`,
      '--follow',
      '--',
      filePath,
    ]);

    if (!output) {
      return JSON.stringify([]);
    }

    const commits: FileHistoryCommit[] = output.split('\n').map((line) => {
      const [hash, shortHash, author, date, message] = line.split('|');
      return {
        hash: hash ?? '',
        shortHash: shortHash ?? '',
        author: author ?? '',
        date: date ?? '',
        message: message ?? '',
      };
    });

    return JSON.stringify(commits);
  },
};
