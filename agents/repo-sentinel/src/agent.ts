import {Session, ToolRegistry, createOpenAIClient} from '@ai/openai-session';
import type {ToolResult} from '@ai/openai-session';
import type {Logger} from '@helpers/logger';
import {
  getRepoStatus,
  fetchRemote,
  getRecentCommits,
  getCommitDetails,
  getCommitDiff,
  getFileContent,
  getFileHistory,
  getBlame,
  searchCommits,
  listChangedFiles,
} from '@openai-tools/git';
import {SYSTEM_PROMPT} from './prompts/system-prompt.js';
import {createUserPrompt} from './prompts/user-prompt.js';
import {
  getOpenAIApiKey,
  getOpenAIBaseURL,
  getOpenAIModel,
} from './helpers/env-helpers.js';

// Import agent-specific tools
import * as getConfig from './tools/get-config.js';
import * as saveReport from './tools/save-report.js';

function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  // Register agent-specific tools
  registry.register(getConfig.definition, getConfig.handler);
  registry.register(saveReport.definition, saveReport.handler);

  // Register git tools from the shared package
  registry.register(getRepoStatus.definition, getRepoStatus.handler);
  registry.register(fetchRemote.definition, fetchRemote.handler);
  registry.register(getRecentCommits.definition, getRecentCommits.handler);
  registry.register(getCommitDetails.definition, getCommitDetails.handler);
  registry.register(getCommitDiff.definition, getCommitDiff.handler);
  registry.register(getFileContent.definition, getFileContent.handler);
  registry.register(getFileHistory.definition, getFileHistory.handler);
  registry.register(getBlame.definition, getBlame.handler);
  registry.register(searchCommits.definition, searchCommits.handler);
  registry.register(listChangedFiles.definition, listChangedFiles.handler);

  return registry;
}

export async function runAgent(logger: Logger): Promise<void> {
  const registry = createToolRegistry();

  const client = createOpenAIClient({
    apiKey: getOpenAIApiKey(),
    baseURL: getOpenAIBaseURL(),
  });

  const session = new Session({
    client,
    model: getOpenAIModel(),
    systemPrompt: SYSTEM_PROMPT,
    tools: registry.getToolDefinitions(),
  });

  logger.info('Starting RepoSentinel agent...');

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
