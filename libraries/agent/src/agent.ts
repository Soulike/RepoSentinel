import {Session, createOpenAIClient} from '@ai/openai-session';
import type {ToolResult} from '@ai/openai-session';
import type {AgentOptions, AgentResult} from './types.js';

/**
 * Runs an agent with the given options and user prompt.
 *
 * Creates an isolated OpenAI session, executes the tool loop until completion,
 * and returns the final response. The session is disposed after execution,
 * preventing context accumulation across calls.
 *
 * @example Basic usage
 * ```typescript
 * import { runAgent } from '@ai/agent';
 * import { ToolRegistry } from '@ai/openai-session';
 *
 * const registry = new ToolRegistry();
 * registry.register(myTool);
 *
 * const result = await runAgent({
 *   apiKey: 'your-api-key',
 *   model: 'gpt-4',
 *   systemPrompt: 'You are a helpful assistant.',
 *   registry,
 * }, 'Hello!');
 *
 * console.log(result.content);
 * ```
 *
 * @example With logging callbacks
 * ```typescript
 * const result = await runAgent({
 *   apiKey: 'your-api-key',
 *   model: 'gpt-4',
 *   systemPrompt: 'You are a helpful assistant.',
 *   registry,
 *   onToolStart: (name, id, args) => console.log(`Tool ${name} started`),
 *   onToolEnd: (name, id, result) => console.log(`Tool ${name} completed`),
 *   onContent: (content) => console.log(`Response: ${content}`),
 * }, 'Hello!');
 * ```
 */
export async function runAgent(
  options: AgentOptions,
  userPrompt: string,
): Promise<AgentResult> {
  const {
    apiKey,
    baseURL,
    model,
    systemPrompt,
    registry,
    onToolStart,
    onToolEnd,
    onToolError,
    onContent,
  } = options;

  const client = createOpenAIClient({
    apiKey,
    baseURL,
  });

  const session = new Session({
    client,
    model,
    systemPrompt,
    tools: registry.getToolDefinitions(),
  });

  let response = await session.chat(userPrompt);

  // Helper to extract and emit content from all choices
  const emitContent = () => {
    for (const choice of response.choices) {
      if (choice.message.content && onContent) {
        onContent(choice.message.content);
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

  // Emit initial response content if any
  emitContent();

  // Tool execution loop
  while (Session.requiresToolCall(response)) {
    const toolCalls = collectToolCalls();

    // Execute all tool calls in parallel
    const results: ToolResult[] = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const toolId = toolCall.id;
        const toolName = toolCall.function.name;
        const toolArgs = toolCall.function.arguments;

        onToolStart?.(toolName, toolId, toolArgs);

        try {
          const output = await registry.execute(toolName, toolArgs);
          onToolEnd?.(toolName, toolId, output);
          return {tool_call_id: toolId, content: output};
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          onToolError?.(toolName, toolId, errorMessage);
          return {
            tool_call_id: toolId,
            content: JSON.stringify({error: errorMessage}),
          };
        }
      }),
    );

    response = await session.submitToolResults(results);
    emitContent();
  }

  // Collect final content from all choices
  const finalContent = response.choices
    .map((choice) => choice.message.content)
    .filter(Boolean)
    .join('\n');

  return {content: finalContent};
}
