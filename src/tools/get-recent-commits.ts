import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../ai/tool-registry.js';
import {execGit} from '../helpers/git-helpers.js';
import {getBranch, getCheckIntervalHours} from '../helpers/env-helpers.js';

export interface Commit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
}

export interface GetRecentCommitsParams {
  hours?: number;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'get_recent_commits',
    description:
      'Get commits from the last N hours on the configured branch. Returns a list of commits with hash, author, date, and message.',
    parameters: {
      type: 'object',
      properties: {
        hours: {
          type: 'number',
          description:
            'Number of hours to look back. Defaults to CHECK_INTERVAL_HOURS env var or 1 hour.',
        },
      },
    },
  },
};

export const handler: ToolFunction<GetRecentCommitsParams> = async (args) => {
  const hours = args.hours ?? getCheckIntervalHours();
  const branch = getBranch();
  const since = `${hours} hours ago`;

  // Format: hash|shortHash|author|date|message
  const format = '%H|%h|%an|%aI|%s';

  const output = await execGit([
    'log',
    branch,
    `--since="${since}"`,
    `--pretty=format:${format}`,
  ]);

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
