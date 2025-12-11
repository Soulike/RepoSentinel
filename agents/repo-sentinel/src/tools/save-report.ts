import type {OpenAITool} from '@ai/openai-session';
import {writeFile, mkdir} from 'fs/promises';
import {dirname, join} from 'path';
import {getBranch, getReportDir} from '../helpers/env-helpers.js';
import {generateReportFilename} from '../helpers/report-utils.js';

export interface SaveReportParams {
  content: string;
  project: string;
  topic: string;
}

export const saveReport: OpenAITool<SaveReportParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'save_report',
      description: `Save the final analysis report to a file. The filename is automatically generated with an ISO timestamp prefix.

Returns: JSON object with:
- success: Boolean indicating save succeeded
- filePath: Absolute path where the report was saved
- filename: Generated filename`,
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'The report content in markdown format.',
          },
          project: {
            type: 'string',
            description:
              'Project or repository name (e.g., "chromium", "ai-apps").',
          },
          topic: {
            type: 'string',
            description:
              'Topic describing the report scope (e.g., "optimization-guide", "full-repo").',
          },
        },
        required: ['content', 'project', 'topic'],
      },
    },
  },
  handler: async (args) => {
    const {content, project, topic} = args;

    const branch = getBranch();

    let filename: string;
    try {
      filename = generateReportFilename(project, branch, topic, new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return JSON.stringify({
        error: 'Invalid parameters',
        details: message,
      });
    }

    const reportDir = getReportDir();
    const filePath = join(reportDir, filename);

    // Ensure directory exists (ignore EEXIST for Windows/Bun compatibility)
    try {
      await mkdir(dirname(filePath), {recursive: true});
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw err;
      }
    }

    try {
      // 'wx' flag: write exclusive - fails if file exists
      await writeFile(filePath, content, {encoding: 'utf-8', flag: 'wx'});
      return JSON.stringify({success: true, filePath, filename});
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return JSON.stringify({
        error: 'Failed to save report',
        filePath,
        filename,
        details: message,
      });
    }
  },
};
