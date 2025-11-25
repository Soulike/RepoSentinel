import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../ai/tool-registry.js';
import {execGit} from '../helpers/git-helpers.js';

export interface SearchCommit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
}

export interface SearchCommitsParams {
  query: string;
  branch: string;
  hours: number;
  path?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'search_commits',
    description: `Search for commits by message keyword within a time window. Useful for finding related changes.

Returns: JSON array of commit objects with:
- hash: Full commit hash
- shortHash: Abbreviated 7-char hash
- author: Commit author name
- date: ISO 8601 timestamp
- message: Commit message subject line`,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Keyword or phrase to search for in commit messages.',
        },
        branch: {
          type: 'string',
          description: 'Branch name to search commits in.',
        },
        hours: {
          type: 'number',
          description: 'Number of hours to look back.',
        },
        path: {
          type: 'string',
          description:
            'Optional path to filter. Only commits affecting this path will be searched.',
        },
      },
      required: ['query', 'branch', 'hours'],
    },
  },
};

export const handler: ToolFunction<SearchCommitsParams> = async (args) => {
  const {query, branch, hours, path} = args;
  const since = `${hours} hours ago`;

  // Format: hash|shortHash|author|date|message
  const format = '%H|%h|%an|%aI|%s';

  const gitArgs = [
    'log',
    branch,
    `--since="${since}"`,
    `--grep=${query}`,
    '--regexp-ignore-case',
    `--pretty=format:${format}`,
  ];

  if (path) {
    gitArgs.push('--', path);
  }

  const output = await execGit(gitArgs);

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
