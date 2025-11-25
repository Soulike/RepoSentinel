import type {
  ChatCompletionFunctionTool,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

export type ToolFunction<T = unknown> = (args: T) => Promise<string> | string;

/**
 * Registry for mapping tool names to their implementations.
 *
 * @example
 * ```typescript
 * const registry = new ToolRegistry();
 *
 * registry.register(
 *   {
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
 *   async (args: { location: string }) => {
 *     return JSON.stringify({ temp: 20, condition: 'sunny' });
 *   }
 * );
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

  register<T>(
    definition: ChatCompletionFunctionTool,
    fn: ToolFunction<T>,
  ): void {
    const name = definition.function.name;
    this.tools.set(name, definition);
    this.functions.set(name, fn as ToolFunction);
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
