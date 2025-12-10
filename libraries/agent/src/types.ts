import type {ToolRegistry} from '@ai/openai-session';

export interface AgentOptions {
  /** OpenAI-compatible API key */
  apiKey: string;
  /** Base URL for API (optional, for non-OpenAI providers) */
  baseURL?: string | undefined;
  /** Model to use (e.g., 'gpt-4', 'gpt-3.5-turbo') */
  model: string;
  /** System prompt to initialize the conversation */
  systemPrompt: string;
  /** Tool registry containing tool definitions and execution logic */
  registry: ToolRegistry;

  // Optional callbacks for logging/monitoring
  /** Called when a tool execution starts */
  onToolStart?: (toolName: string, toolId: string, args: string) => void;
  /** Called when a tool execution completes successfully */
  onToolEnd?: (toolName: string, toolId: string, result: string) => void;
  /** Called when a tool execution fails */
  onToolError?: (toolName: string, toolId: string, error: string) => void;
  /** Called when the agent produces content (intermediate or final) */
  onContent?: (content: string) => void;
}

export interface AgentResult {
  /** Final text response from the agent */
  content: string;
}
