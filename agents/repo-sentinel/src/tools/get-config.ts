import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import type {Config} from '../types.js';
import {
  getRepoProvider,
  getRepoPath,
  getGitHubOwner,
  getGitHubRepo,
  getGerritHost,
  getGerritProject,
  getBranch,
  getCheckIntervalHours,
  getReportDir,
  getSubPath,
} from '../helpers/env-helpers.js';
import {GitHubTokenStore} from '../stores/github-token-store.js';

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'get_config',
    description: `Get the current RepoSentinel configuration.

Returns: JSON object with:
- provider: "local", "github", or "gerrit"
- branch: Branch name to monitor
- checkIntervalHours: Number of hours to look back
- reportDir: Directory to save reports
- subPaths: Array of sub-paths within repo to scope analysis

For local provider:
- repoPath: Absolute path to the repository (use as repoPath parameter for git tools)

For github provider:
- owner: Repository owner (use as owner parameter for github tools)
- repo: Repository name (use as repo parameter for github tools)
- token: GitHub access token (use as token parameter for github tools)

For gerrit provider:
- host: Gerrit host (use as host parameter for gerrit tools)
- project: Project name (use as project parameter for gerrit tools)`,
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export const handler: ToolFunction<Record<string, never>> = async () => {
  const provider = getRepoProvider();

  const baseConfig = {
    provider,
    branch: getBranch(),
    checkIntervalHours: getCheckIntervalHours(),
    reportDir: getReportDir(),
    subPaths: getSubPath(),
  };

  let config: Config;

  if (provider === 'github') {
    config = {
      ...baseConfig,
      provider: 'github',
      owner: getGitHubOwner(),
      repo: getGitHubRepo(),
      token: GitHubTokenStore.get(),
    };
  } else if (provider === 'gerrit') {
    config = {
      ...baseConfig,
      provider: 'gerrit',
      host: getGerritHost(),
      project: getGerritProject(),
    };
  } else {
    config = {
      ...baseConfig,
      provider: 'local',
      repoPath: getRepoPath(),
    };
  }

  return JSON.stringify(config);
};
