import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {readFile} from 'fs/promises';
import {join, basename} from 'path';
import {getReportDir} from '../helpers/env-helpers.js';

export interface ReadReportParams {
  filename: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'read_report',
    description: `Read content of a past report file.

Returns: The report content as markdown text, or error JSON if file not found.`,
    parameters: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Filename of the report to read (from list_reports).',
        },
      },
      required: ['filename'],
    },
  },
};

export const handler: ToolFunction<ReadReportParams> = async (args) => {
  const {filename} = args;

  // Security: prevent path traversal
  if (
    filename.includes('..') ||
    filename.includes('/') ||
    filename.includes('\\')
  ) {
    return JSON.stringify({error: 'Invalid filename'});
  }

  // Security: only allow .md files
  if (!filename.endsWith('.md')) {
    return JSON.stringify({error: 'Only .md files can be read'});
  }

  // Ensure filename is just the basename
  const safeFilename = basename(filename);
  const reportDir = getReportDir();
  const filePath = join(reportDir, safeFilename);

  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return JSON.stringify({
      error: 'Failed to read report',
      filename: safeFilename,
      details: message,
    });
  }
};
