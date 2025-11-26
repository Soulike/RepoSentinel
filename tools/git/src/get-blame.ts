import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {execGit} from './git-helpers.js';

export interface BlameLine {
  lineNumber: number;
  hash: string;
  author: string;
  date: string;
  content: string;
}

export interface GetBlameParams {
  repoPath: string;
  filePath: string;
  startLine?: number;
  endLine?: number;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'get_blame',
    description: `Show who last modified each line of a file. Useful for understanding code ownership and history.

Returns: JSON array of line objects with:
- lineNumber: 1-based line number
- hash: Short commit hash (8 chars)
- author: Author who last modified this line
- date: ISO 8601 timestamp of modification
- content: The actual line content`,
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
        startLine: {
          type: 'number',
          description:
            'Starting line number (1-based). If omitted, starts from line 1.',
        },
        endLine: {
          type: 'number',
          description:
            'Ending line number (1-based). If omitted, goes to end of file.',
        },
      },
      required: ['repoPath', 'filePath'],
    },
  },
};

export const handler: ToolFunction<GetBlameParams> = async (args) => {
  const {repoPath, filePath, startLine, endLine} = args;

  const gitArgs = ['blame', '--line-porcelain'];

  if (startLine !== undefined && endLine !== undefined) {
    gitArgs.push(`-L`, `${startLine},${endLine}`);
  } else if (startLine !== undefined) {
    gitArgs.push(`-L`, `${startLine},`);
  }

  gitArgs.push('--', filePath);

  const output = await execGit(repoPath, gitArgs);

  if (!output) {
    return JSON.stringify([]);
  }

  const lines: BlameLine[] = [];
  const blocks = output.split('\n');

  let currentHash = '';
  let currentAuthor = '';
  let currentDate = '';
  let currentLineNumber = 0;

  for (const line of blocks) {
    // Line starting with 40-char hash indicates new blame entry
    const hashMatch = line.match(/^([a-f0-9]{40})\s+\d+\s+(\d+)/);
    if (hashMatch) {
      currentHash = hashMatch[1] ?? '';
      currentLineNumber = parseInt(hashMatch[2] ?? '0', 10);
      continue;
    }

    if (line.startsWith('author ')) {
      currentAuthor = line.slice(7);
      continue;
    }

    if (line.startsWith('author-time ')) {
      const timestamp = parseInt(line.slice(12), 10);
      currentDate = new Date(timestamp * 1000).toISOString();
      continue;
    }

    // Line starting with tab is the actual content
    if (line.startsWith('\t')) {
      lines.push({
        lineNumber: currentLineNumber,
        hash: currentHash.slice(0, 8),
        author: currentAuthor,
        date: currentDate,
        content: line.slice(1),
      });
    }
  }

  return JSON.stringify(lines);
};
