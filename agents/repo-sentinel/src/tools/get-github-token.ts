import type {OpenAITool} from '@ai/openai-session';
import {GitHubTokenStore} from '../stores/github-token-store.js';

export const getGitHubToken: OpenAITool<Record<string, never>> = {
  definition: {
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
  },
  handler: async () => {
    const token = GitHubTokenStore.get();
    if (!token) {
      throw new Error('GitHub token not available');
    }
    return token;
  },
};
