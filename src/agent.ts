import {Session} from './ai/session.js';
import type {ToolResult} from './ai/session.js';
import {ToolRegistry} from './ai/tool-registry.js';
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

  console.log('Starting RepoSentinel agent...\n');

  let response = await session.chat(createUserPrompt());

  console.log(JSON.stringify(response, null, 2));

  // Output initial response content if any
  const initialContent = response.choices[0]?.message.content;
  if (initialContent) {
    console.log(`Assistant: ${initialContent}\n`);
  }

  while (Session.requiresToolCall(response)) {
    const toolCalls = response.choices[0]?.message.tool_calls ?? [];
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      if (toolCall.type !== 'function') {
        continue;
      }

      const toolName = toolCall.function.name;
      const toolArgs = toolCall.function.arguments;

      console.log(`\n--- Tool Call: ${toolName} ---`);
      console.log(`Input: ${toolArgs}`);

      try {
        const output = await registry.execute(toolName, toolArgs);
        console.log(`Output: ${output}`);
        results.push({tool_call_id: toolCall.id, content: output});
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`Error: ${errorMessage}`);
        results.push({
          tool_call_id: toolCall.id,
          content: JSON.stringify({error: errorMessage}),
        });
      }
      console.log(`--- End ${toolName} ---\n`);
    }

    response = await session.submitToolResults(results);

    // Output response content after each tool result submission
    const content = response.choices[0]?.message.content;
    if (content) {
      console.log(`\nAssistant: ${content}\n`);
    }
  }

  const finalMessage = response.choices[0]?.message.content;
  if (finalMessage) {
    console.log('\nAgent completed:\n');
    console.log(finalMessage);
  }
}
