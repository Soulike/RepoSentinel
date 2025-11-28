import type {OpenAITool} from '@ai/openai-session';
import {writeFile, mkdir} from 'fs/promises';
import {dirname, join} from 'path';
import {getReportDir} from '../helpers/env-helpers.js';

export interface SaveReportParams {
  content: string;
  filename: string;
}

export const saveReport: OpenAITool<SaveReportParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'save_report',
      description: `Save the final analysis report to a file. Use this to output the completed report summarizing code changes.

Returns: JSON object with:
- success: Boolean indicating save succeeded
- filePath: Absolute path where the report was saved`,
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'The report content in markdown format.',
          },
          filename: {
            type: 'string',
            description:
              'Filename for the report. Will be saved to REPORT_DIR.',
          },
        },
        required: ['content', 'filename'],
      },
    },
  },
  handler: async (args) => {
    const {content, filename} = args;

    const reportDir = getReportDir();
    const filePath = join(reportDir, filename);

    // Ensure directory exists
    await mkdir(dirname(filePath), {recursive: true});

    try {
      // 'wx' flag: write exclusive - fails if file exists
      await writeFile(filePath, content, {encoding: 'utf-8', flag: 'wx'});
      return JSON.stringify({success: true, filePath});
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return JSON.stringify({
        error: 'Failed to save report',
        filePath,
        details: message,
      });
    }
  },
};
