import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../ai/tool-registry.js';
import {execGit} from '../helpers/git-helpers.js';

export interface Commit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
}

export interface GetRecentCommitsParams {
  branch: string;
  hours: number;
  path?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'get_recent_commits',
    description: `Get commits from the last N hours on the specified branch.

Returns: JSON array of commit objects with:
- hash: Full commit hash
- shortHash: Abbreviated 7-char hash
- author: Commit author name
- date: ISO 8601 timestamp
- message: Commit message subject line`,
    parameters: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: 'Branch name to get commits from.',
        },
        hours: {
          type: 'number',
          description: 'Number of hours to look back.',
        },
        path: {
          type: 'string',
          description:
            'Optional path to filter commits. Only commits affecting this path will be returned.',
        },
      },
      required: ['branch', 'hours'],
    },
  },
};

export const handler: ToolFunction<GetRecentCommitsParams> = async (args) => {
  const {branch, hours, path} = args;
  const since = `${hours} hours ago`;

  // Format: hash|shortHash|author|date|message
  const format = '%H|%h|%an|%aI|%s';

  const gitArgs = [
    'log',
    branch,
    `--since="${since}"`,
    `--pretty=format:${format}`,
  ];

  if (path) {
    gitArgs.push('--', path);
  }

  const output = await execGit(gitArgs);

  if (!output) {
    return JSON.stringify([]);
  }

  const commits: Commit[] = output.split('\n').map((line) => {
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
};
