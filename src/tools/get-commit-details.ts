import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../ai/tool-registry.js';
import {execGit} from '../helpers/git-helpers.js';

export interface ChangedFile {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
}

export interface CommitDetails {
  hash: string;
  author: string;
  date: string;
  message: string;
  files: ChangedFile[];
}

export interface GetCommitDetailsParams {
  commitHash: string;
  path?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'get_commit_details',
    description: `Get detailed information about a specific commit including the list of changed files with their status and line changes.

Returns: JSON object with:
- hash: Full commit hash
- author: Commit author name
- date: ISO 8601 timestamp
- message: Full commit message
- files: Array of changed files, each with:
  - path: File path
  - status: One of "added", "modified", "deleted", "renamed"
  - additions: Number of lines added
  - deletions: Number of lines removed`,
    parameters: {
      type: 'object',
      properties: {
        commitHash: {
          type: 'string',
          description: 'The commit hash to inspect (full or short hash).',
        },
        path: {
          type: 'string',
          description:
            'Optional path to filter. Only files under this path will be included in the result.',
        },
      },
      required: ['commitHash'],
    },
  },
};

const STATUS_MAP: Record<string, ChangedFile['status']> = {
  A: 'added',
  M: 'modified',
  D: 'deleted',
  R: 'renamed',
};

export const handler: ToolFunction<GetCommitDetailsParams> = async (args) => {
  const {commitHash, path} = args;

  // Get commit metadata
  const format = '%H|%an|%aI|%B';
  const metaOutput = await execGit([
    'show',
    commitHash,
    '--no-patch',
    `--pretty=format:${format}`,
  ]);

  const [hash, author, date, ...messageParts] = metaOutput.split('|');
  const message = messageParts.join('|').trim();

  // Get file changes with stats
  const statsArgs = ['show', commitHash, '--numstat', '--pretty=format:'];
  if (path) {
    statsArgs.push('--', path);
  }
  const statsOutput = await execGit(statsArgs);

  // Get file statuses
  const statusArgs = ['show', commitHash, '--name-status', '--pretty=format:'];
  if (path) {
    statusArgs.push('--', path);
  }
  const statusOutput = await execGit(statusArgs);

  const statusLines = statusOutput
    .split('\n')
    .filter((line) => line.trim() !== '');
  const statsLines = statsOutput
    .split('\n')
    .filter((line) => line.trim() !== '');

  const files: ChangedFile[] = [];

  for (let i = 0; i < statusLines.length; i++) {
    const statusLine = statusLines[i];
    const statsLine = statsLines[i];

    if (!statusLine) continue;

    const statusMatch = statusLine.match(/^([AMDRT])\d*\t(.+?)(?:\t(.+))?$/);
    if (!statusMatch) continue;

    const [, statusCode, filePath] = statusMatch;
    const status = STATUS_MAP[statusCode?.charAt(0) ?? 'M'] ?? 'modified';

    let additions = 0;
    let deletions = 0;

    if (statsLine) {
      const statsMatch = statsLine.match(/^(\d+|-)\t(\d+|-)\t/);
      if (statsMatch) {
        additions =
          statsMatch[1] === '-' ? 0 : parseInt(statsMatch[1] ?? '0', 10);
        deletions =
          statsMatch[2] === '-' ? 0 : parseInt(statsMatch[2] ?? '0', 10);
      }
    }

    files.push({
      path: filePath ?? '',
      status,
      additions,
      deletions,
    });
  }

  const result: CommitDetails = {
    hash: hash ?? '',
    author: author ?? '',
    date: date ?? '',
    message,
    files,
  };

  return JSON.stringify(result);
};
