import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {writeFile, mkdir} from 'fs/promises';
import {dirname, join} from 'path';
import {getReportDir} from '../helpers/env-helpers.js';

export interface SaveReportParams {
  content: string;
  filename: string;
}

export const definition: ChatCompletionFunctionTool = {
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
          description: 'Filename for the report. Will be saved to REPORT_DIR.',
        },
      },
      required: ['content', 'filename'],
    },
  },
};

export const handler: ToolFunction<SaveReportParams> = async (args) => {
  const {content, filename} = args;

  const reportDir = getReportDir();
  const filePath = join(reportDir, filename);

  // Ensure directory exists
  await mkdir(dirname(filePath), {recursive: true});

  await writeFile(filePath, content, 'utf-8');

  return JSON.stringify({success: true, filePath});
};
