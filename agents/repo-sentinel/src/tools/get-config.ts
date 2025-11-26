import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {
  getRepoPath,
  getBranch,
  getCheckIntervalHours,
  getReportDir,
  getSubPath,
} from '../helpers/env-helpers.js';

export interface Config {
  repoPath: string;
  branch: string;
  checkIntervalHours: number;
  reportDir: string;
  subPaths: string[];
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'get_config',
    description: `Get the current RepoSentinel configuration.

Returns: JSON object with:
- repoPath: Absolute path to the repository (IMPORTANT: use this value as the repoPath parameter for all git tools)
- branch: Branch name to monitor
- checkIntervalHours: Number of hours to look back
- reportDir: Directory to save reports
- subPaths: Array of sub-paths within repo to scope analysis`,
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export const handler: ToolFunction<Record<string, never>> = async () => {
  const config: Config = {
    repoPath: getRepoPath(),
    branch: getBranch(),
    checkIntervalHours: getCheckIntervalHours(),
    reportDir: getReportDir(),
    subPaths: getSubPath(),
  };

  return JSON.stringify(config);
};
