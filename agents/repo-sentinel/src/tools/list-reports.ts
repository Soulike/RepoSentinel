import type {OpenAITool} from '@ai/openai-session';
import {readdir, stat} from 'fs/promises';
import {join} from 'path';
import {getReportDir} from '../helpers/env-helpers.js';

export interface ListReportsParams {
  limit: number;
}

interface ReportInfo {
  filename: string;
  modifiedAt: string;
}

const MAX_LIMIT = 100;

export const listReports: OpenAITool<ListReportsParams> = {
  definition: {
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
            description: 'Maximum number of reports to return (1-100).',
          },
        },
        required: ['limit'],
      },
    },
  },
  handler: async (args) => {
    const {limit} = args;

    if (limit < 1 || limit > MAX_LIMIT) {
      return JSON.stringify({
        error: `limit must be between 1 and ${MAX_LIMIT}`,
      });
    }

    const reportDir = getReportDir();

    let files: string[];
    try {
      files = await readdir(reportDir);
    } catch {
      return JSON.stringify([]);
    }

    const mdFiles = files.filter((f) => f.endsWith('.md'));

    const results = await Promise.all(
      mdFiles.map(async (filename): Promise<ReportInfo | null> => {
        const filePath = join(reportDir, filename);
        try {
          const stats = await stat(filePath);
          return {
            filename,
            modifiedAt: stats.mtime.toISOString(),
          };
        } catch {
          return null;
        }
      }),
    );

    const reports = results.filter((r): r is ReportInfo => r !== null);

    reports.sort(
      (a, b) =>
        new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime(),
    );

    return JSON.stringify(reports.slice(0, limit));
  },
};
