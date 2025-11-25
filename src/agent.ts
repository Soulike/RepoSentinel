import {Session} from './ai/session.js';
import type {ToolResult} from './ai/session.js';
import {ToolRegistry} from './ai/tool-registry.js';
import {logger} from './logger/logger.js';
import {SYSTEM_PROMPT} from './prompts/system-prompt.js';
import {createUserPrompt} from './prompts/user-prompt.js';

// Import all tools
import * as getConfig from './tools/get-config.js';
import * as getRepoStatus from './tools/get-repo-status.js';
import * as fetchRemote from './tools/fetch-remote.js';
import * as getRecentCommits from './tools/get-recent-commits.js';
import * as getCommitDetails from './tools/get-commit-details.js';
import * as getCommitDiff from './tools/get-commit-diff.js';
import * as getFileContent from './tools/get-file-content.js';
import * as getFileHistory from './tools/get-file-history.js';
import * as getBlame from './tools/get-blame.js';
import * as searchCommits from './tools/search-commits.js';
import * as listChangedFiles from './tools/list-changed-files.js';
import * as saveReport from './tools/save-report.js';

function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register(getConfig.definition, getConfig.handler);
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
  registry.register(saveReport.definition, saveReport.handler);

  return registry;
}

export async function runAgent(): Promise<void> {
  const registry = createToolRegistry();

  const session = new Session({
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
