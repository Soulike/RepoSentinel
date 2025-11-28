import type {OpenAITool} from '@ai/openai-session';
import {readFile} from 'fs/promises';
import {join, basename} from 'path';
import {getReportDir} from '../helpers/env-helpers.js';

export interface ReadReportParams {
  filename: string;
}

export const readReport: OpenAITool<ReadReportParams> = {
  definition: {
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
  },
  handler: async (args) => {
    // Sanitize: strip directory components first
    const safeFilename = basename(args.filename);

    // Validate: only allow .md files
    if (!safeFilename.endsWith('.md')) {
      return JSON.stringify({error: 'Only .md files can be read'});
    }

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
  },
};
