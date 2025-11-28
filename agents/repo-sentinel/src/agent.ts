import {Session, ToolRegistry, createOpenAIClient} from '@ai/openai-session';
import type {ToolResult} from '@ai/openai-session';
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

function createToolRegistry(provider: RepoProvider): ToolRegistry {
  const registry = new ToolRegistry();

  // Register agent-specific tools
  registry.register(getConfig);
  registry.register(listReports);
  registry.register(readReport);
  registry.register(saveReport);

  // Register provider-specific tools
  if (provider === 'github') {
    registry.register(getGitHubToken);
    registry.registerAll(githubTools);
  } else if (provider === 'gerrit') {
    registry.registerAll(gerritTools);
  } else if (provider === 'ado') {
    registry.register(getAdoToken);
    registry.registerAll(adoTools);
  } else {
    registry.registerAll(gitTools);
  }

  return registry;
}

export async function runAgent(logger: Logger): Promise<void> {
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

  const client = createOpenAIClient({
    apiKey: getOpenAIApiKey(),
    baseURL: getOpenAIBaseURL(),
  });

  const session = new Session({
    client,
    model: getOpenAIModel(),
    systemPrompt: createSystemPrompt(provider, getCustomPrompt()),
    tools: registry.getToolDefinitions(),
  });

  logger.info(`Starting RepoSentinel agent with ${provider} provider...`);

  let response = await session.chat(createUserPrompt());

  logger.debug('API Response', response);

  // Helper to extract and print content from all choices
  const printContent = () => {
    for (const choice of response.choices) {
      if (choice.message.content) {
        logger.assistant(choice.message.content);
      }
    }
  };

  // Helper to collect all tool calls from all choices
  const collectToolCalls = () => {
    return response.choices.flatMap(
      (choice) =>
        choice.message.tool_calls?.filter((tc) => tc.type === 'function') ?? [],
    );
  };

  // Output initial response content if any
  printContent();

  while (Session.requiresToolCall(response)) {
    const toolCalls = collectToolCalls();

    // Execute all tool calls in parallel
    const results: ToolResult[] = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const toolId = toolCall.id;
        const toolName = toolCall.function.name;
        const toolArgs = toolCall.function.arguments;

        logger.toolStart(toolName, toolId, toolArgs);

        try {
          const output = await registry.execute(toolName, toolArgs);
          logger.toolEnd(toolName, toolId, output);
          return {tool_call_id: toolId, content: output};
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.toolError(toolName, toolId, errorMessage);
          return {
            tool_call_id: toolId,
            content: JSON.stringify({error: errorMessage}),
          };
        }
      }),
    );

    response = await session.submitToolResults(results);
    printContent();
  }

  // Print any final content
  printContent();
}
