import OpenAI from 'openai';

export interface OpenAIClientOptions {
  apiKey: string;
  baseURL?: string | undefined;
}

/**
 * Creates an OpenAI client instance.
 *
 * @param options - Client configuration
 * @param options.apiKey - OpenAI API key
 * @param options.baseURL - Optional custom base URL for OpenAI-compatible APIs
 */
export function createOpenAIClient(options: OpenAIClientOptions): OpenAI {
  return new OpenAI({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
  });
}
