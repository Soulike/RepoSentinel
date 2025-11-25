import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../ai/tool-registry.js';
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
  subPath: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'get_config',
    description: `Get the current RepoSentinel configuration.

Returns: JSON object with:
- repoPath: Absolute path to the repository
- branch: Branch name to monitor
- checkIntervalHours: Number of hours to look back
- reportDir: Directory to save reports
- subPath: Sub-path within repo to scope analysis`,
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
    subPath: getSubPath(),
  };

  return JSON.stringify(config);
};
