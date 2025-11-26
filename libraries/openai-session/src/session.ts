import type OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolMessageParam,
} from 'openai/resources/chat/completions';

export type ToolResult = Omit<ChatCompletionToolMessageParam, 'role'>;

export interface SessionOptions {
  /** OpenAI client instance */
  client: OpenAI;
  /** Model to use (e.g., 'gpt-4', 'gpt-3.5-turbo') */
  model: string;
  /** System prompt to initialize the conversation */
  systemPrompt?: string;
  /** Tool definitions for function calling */
  tools?: ChatCompletionTool[];
}

/**
 * Manages a conversation session with an OpenAI-compatible API.
 *
 * @example Basic usage
 * ```typescript
 * import { createOpenAIClient, Session } from '@ai/openai-session';
 *
 * const client = createOpenAIClient({ apiKey: 'your-api-key' });
 * const session = new Session({
 *   client,
 *   model: 'gpt-4',
 *   systemPrompt: 'You are a helpful assistant.',
 * });
 *
 * const response = await session.chat('Hello!');
 * console.log(response.choices[0].message.content);
 * ```
 *
 * @example Using tools
 * ```typescript
 * const session = new Session({
 *   client,
 *   model: 'gpt-4',
 *   tools: [
 *     {
 *       type: 'function',
 *       function: {
 *         name: 'get_weather',
 *         description: 'Get current weather for a location',
 *         parameters: {
 *           type: 'object',
 *           properties: { location: { type: 'string' } },
 *           required: ['location'],
 *         },
 *       },
 *     },
 *   ],
 * });
 *
 * let response = await session.chat('What is the weather in Tokyo?');
 *
 * while (Session.requiresToolCall(response)) {
 *   const toolCalls = response.choices[0].message.tool_calls!;
 *   const results: ToolResult[] = toolCalls.map((call) => ({
 *     tool_call_id: call.id,
 *     content: executeMyTool(call.function.name, call.function.arguments),
 *   }));
 *   response = await session.submitToolResults(results);
 * }
 * ```
 */
export class Session {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly tools: ChatCompletionTool[];
  private messages: ChatCompletionMessageParam[] = [];

  constructor(options: SessionOptions) {
    this.client = options.client;
    this.model = options.model;
    this.tools = options.tools ?? [];

    if (options.systemPrompt) {
      this.messages.push({role: 'system', content: options.systemPrompt});
    }
  }

  /**
   * Checks if a response requires tool calls to be executed.
   */
  static requiresToolCall(
    response: OpenAI.Chat.Completions.ChatCompletion,
  ): boolean {
    // Check all choices - some APIs return tool calls in separate choices
    return response.choices.some(
      (choice) => choice.finish_reason === 'tool_calls',
    );
  }

  addUserMessage(content: string): void {
    this.messages.push({role: 'user', content});
  }

  addAssistantMessage(content: string): void {
    this.messages.push({role: 'assistant', content});
  }

  async chat(
    userMessage: string,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    this.addUserMessage(userMessage);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: this.messages,
      ...(this.tools.length > 0 && {tools: this.tools}),
    });

    // Merge content and tool_calls from all choices into a single assistant message
    // Some APIs (like Claude) return separate choices for content and tool calls
    this.addAssistantMessageFromResponse(response);

    return response;
  }

  /**
   * Merges all choices from a response into a single assistant message.
   * Handles APIs that return content and tool_calls in separate choices.
   */
  private addAssistantMessageFromResponse(
    response: OpenAI.Chat.Completions.ChatCompletion,
  ): void {
    const allContent: string[] = [];
    const allToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] =
      [];

    for (const choice of response.choices) {
      if (choice.message.content) {
        allContent.push(choice.message.content);
      }
      if (choice.message.tool_calls) {
        allToolCalls.push(...choice.message.tool_calls);
      }
    }

    const mergedMessage: ChatCompletionMessageParam = {
      role: 'assistant',
      content: allContent.join('\n') || null,
      ...(allToolCalls.length > 0 && {tool_calls: allToolCalls}),
    };

    this.messages.push(mergedMessage);
  }

  async submitToolResults(
    results: ToolResult[],
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const toolMessages: ChatCompletionToolMessageParam[] = results.map(
      (result) => ({
        role: 'tool' as const,
        ...result,
      }),
    );

    this.messages.push(...toolMessages);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: this.messages,
      ...(this.tools.length > 0 && {tools: this.tools}),
    });

    this.addAssistantMessageFromResponse(response);

    return response;
  }

  getMessages(): ChatCompletionMessageParam[] {
    return [...this.messages];
  }

  clearMessages(): void {
    this.messages = [];
  }
}
