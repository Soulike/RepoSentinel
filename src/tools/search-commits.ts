import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../ai/tool-registry.js';
import {execGit} from '../helpers/git-helpers.js';
import {getBranch, getCheckIntervalHours} from '../helpers/env-helpers.js';

export interface SearchCommit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
}

export interface SearchCommitsParams {
  query: string;
  hours?: number;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'search_commits',
    description:
      'Search for commits by message keyword within a time window. Useful for finding related changes.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Keyword or phrase to search for in commit messages.',
        },
        hours: {
          type: 'number',
          description:
            'Number of hours to look back. Defaults to CHECK_INTERVAL_HOURS env var or 1 hour.',
        },
      },
      required: ['query'],
    },
  },
};

export const handler: ToolFunction<SearchCommitsParams> = async (args) => {
  const {query, hours} = args;
  const branch = getBranch();
  const lookbackHours = hours ?? getCheckIntervalHours();
  const since = `${lookbackHours} hours ago`;

  // Format: hash|shortHash|author|date|message
  const format = '%H|%h|%an|%aI|%s';

  const output = await execGit([
    'log',
    branch,
    `--since="${since}"`,
    `--grep=${query}`,
    '--regexp-ignore-case',
    `--pretty=format:${format}`,
  ]);

  if (!output) {
    return JSON.stringify([]);
  }

  const commits: SearchCommit[] = output.split('\n').map((line) => {
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
