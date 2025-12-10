import {ToolRegistry} from '@ai/openai-session';
import {runAgent} from '@ai/agent';
import type {Logger} from '@helpers/logger';
import {authenticateWithDeviceFlow, validateToken} from '@helpers/github-auth';
import {getAdoAccessToken} from '@helpers/ado-auth';
import {allTools as adoTools} from '@openai-tools/ado';
import {allTools as gerritTools} from '@openai-tools/gerrit';
import {allTools as gitTools} from '@openai-tools/git';
import {allTools as githubTools} from '@openai-tools/github';
import {createSystemPrompt} from './prompts/system-prompt.js';
import {createUserPrompt} from './prompts/user-prompt.js';
import {
  getOpenAIApiKey,
  getOpenAIBaseURL,
  getOpenAIModel,
  getRepoProvider,
  getCustomPrompt,
} from './helpers/env-helpers.js';
import {AdoTokenStore} from './stores/ado-token-store.js';
import {GitHubTokenStore} from './stores/github-token-store.js';
import type {RepoProvider} from './types.js';

// Import agent-specific tools
import {getAdoToken} from './tools/get-ado-token.js';
import {getConfig} from './tools/get-config.js';
import {getGitHubToken} from './tools/get-github-token.js';
import {listReports} from './tools/list-reports.js';
import {readReport} from './tools/read-report.js';
import {saveReport} from './tools/save-report.js';

// Import sub-agent tools
import {analyzeGitCommit} from './subagent-tools/git-analyzer.js';
import {analyzeGitHubCommit} from './subagent-tools/github-analyzer.js';
import {analyzeAdoCommit} from './subagent-tools/ado-analyzer.js';
import {analyzeGerritChange} from './subagent-tools/gerrit-analyzer.js';

function createToolRegistry(provider: RepoProvider): ToolRegistry {
  const registry = new ToolRegistry();

  // Register agent-specific tools
  registry.register(getConfig);
  registry.register(listReports);
  registry.register(readReport);
  registry.register(saveReport);

  // Register provider-specific tools + analyzer
  if (provider === 'github') {
    registry.register(analyzeGitHubCommit);
    registry.register(getGitHubToken);
    registry.registerAll(githubTools);
  } else if (provider === 'gerrit') {
    registry.register(analyzeGerritChange);
    registry.registerAll(gerritTools);
  } else if (provider === 'ado') {
    registry.register(analyzeAdoCommit);
    registry.register(getAdoToken);
    registry.registerAll(adoTools);
  } else {
    registry.register(analyzeGitCommit);
    registry.registerAll(gitTools);
  }

  return registry;
}

export async function runRepoSentinelAgent(logger: Logger): Promise<void> {
  const provider = getRepoProvider();

  // Authenticate with GitHub if using GitHub provider
  if (provider === 'github') {
    const existingToken = GitHubTokenStore.get();
    const isValid = existingToken ? await validateToken(existingToken) : false;

    if (!isValid) {
      try {
        const token = await authenticateWithDeviceFlow(['repo']);
        GitHubTokenStore.set(token);
      } catch (cause) {
        throw new Error('GitHub authentication failed', {cause});
      }
    }
  }

  // Authenticate with Azure DevOps if using ADO provider
  if (provider === 'ado' && !AdoTokenStore.get()) {
    try {
      const token = await getAdoAccessToken();
      AdoTokenStore.set(token);
    } catch (cause) {
      throw new Error('Azure DevOps authentication failed', {cause});
    }
  }

  const registry = createToolRegistry(provider);

  logger.info(`Starting RepoSentinel agent with ${provider} provider...`);

  // Use runAgent with logging callbacks
  const result = await runAgent(
    {
      apiKey: getOpenAIApiKey(),
      baseURL: getOpenAIBaseURL(),
      model: getOpenAIModel(),
      systemPrompt: createSystemPrompt(provider, getCustomPrompt()),
      registry,
      // Pass logger callbacks for visibility
      onToolStart: (name, id, args) => logger.toolStart(name, id, args),
      onToolEnd: (name, id, output) => logger.toolEnd(name, id, output),
      onToolError: (name, id, error) => logger.toolError(name, id, error),
      onContent: (content) => logger.assistant(content),
    },
    createUserPrompt(),
  );

  // Log final content (may be duplicate if onContent already logged it)
  if (result.content) {
    logger.assistant(result.content);
  }
}
