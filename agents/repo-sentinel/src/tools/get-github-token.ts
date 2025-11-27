import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {GitHubTokenStore} from '../stores/github-token-store.js';

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'get_github_token',
    description: `Get the GitHub authentication token.

Use this token as the 'token' parameter for all GitHub API tools.

Returns: The GitHub access token string.`,
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export const handler: ToolFunction<Record<string, never>> = async () => {
  const token = GitHubTokenStore.get();
  if (!token) {
    throw new Error('GitHub token not available');
  }
  return token;
};
