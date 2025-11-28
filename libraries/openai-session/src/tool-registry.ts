import type {
  ChatCompletionFunctionTool,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

export type ToolFunction<T = unknown> = (args: T) => Promise<string> | string;

/**
 * A type-safe OpenAI tool that bundles definition and handler together.
 *
 * The `in` modifier marks T as contravariant, which allows OpenAITool<SpecificType>
 * to be assigned to OpenAITool<unknown> for use in arrays and registries.
 */
export interface OpenAITool<T> {
  definition: ChatCompletionFunctionTool;
  handler: ToolFunction<T>;
}

/**
 * Registry for mapping tool names to their implementations.
 *
 * @example
 * ```typescript
 * const registry = new ToolRegistry();
 *
 * const getWeather: OpenAITool<{ location: string }> = {
 *   definition: {
 *     type: 'function',
 *     function: {
 *       name: 'get_weather',
 *       description: 'Get current weather for a location',
 *       parameters: {
 *         type: 'object',
 *         properties: {
 *           location: { type: 'string' },
 *         },
 *         required: ['location'],
 *       },
 *     },
 *   },
 *   handler: async (args) => {
 *     return JSON.stringify({ temp: 20, condition: 'sunny' });
 *   },
 * };
 *
 * registry.register(getWeather);
 *
 * // Get tool definitions for Session
 * const session = new Session({ tools: registry.getToolDefinitions() });
 *
 * // Execute a tool call
 * const result = await registry.execute('get_weather', '{"location": "Tokyo"}');
 * ```
 */
export class ToolRegistry {
  private tools = new Map<string, ChatCompletionFunctionTool>();
  private functions = new Map<string, ToolFunction>();

  register<T>(tool: OpenAITool<T>): void {
    const name = tool.definition.function.name;
    this.tools.set(name, tool.definition);
    this.functions.set(name, tool.handler as ToolFunction);
  }

  registerAll<T extends unknown[]>(tools: {
    [K in keyof T]: OpenAITool<T[K]>;
  }): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  async execute(name: string, argsJson: string): Promise<string> {
    const fn = this.functions.get(name);
    if (!fn) {
      throw new Error(`Tool not found: ${name}`);
    }
    const args: unknown = JSON.parse(argsJson);
    const result = await fn(args);
    return result.trim();
  }

  getToolDefinitions(): ChatCompletionTool[] {
    return [...this.tools.values()];
  }

  has(name: string): boolean {
    return this.functions.has(name);
  }
}
