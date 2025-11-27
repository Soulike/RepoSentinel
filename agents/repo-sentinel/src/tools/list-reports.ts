import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {readdir, stat} from 'fs/promises';
import {join} from 'path';
import {getReportDir} from '../helpers/env-helpers.js';

export interface ListReportsParams {
  limit?: number;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'list_reports',
    description: `List past report files. Returns most recent reports first.

Returns: JSON array of report objects with filename and modifiedAt timestamp.`,
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of reports to return. Defaults to 10.',
        },
      },
      required: [],
    },
  },
};

interface ReportInfo {
  filename: string;
  modifiedAt: string;
}

export const handler: ToolFunction<ListReportsParams> = async (args) => {
  const limit = args.limit ?? 10;
  const reportDir = getReportDir();

  let files: string[];
  try {
    files = await readdir(reportDir);
  } catch {
    return JSON.stringify([]);
  }

  const mdFiles = files.filter((f) => f.endsWith('.md'));

  const reports: ReportInfo[] = [];
  for (const filename of mdFiles) {
    const filePath = join(reportDir, filename);
    const stats = await stat(filePath);
    reports.push({
      filename,
      modifiedAt: stats.mtime.toISOString(),
    });
  }

  reports.sort(
    (a, b) =>
      new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime(),
  );

  return JSON.stringify(reports.slice(0, limit));
};
