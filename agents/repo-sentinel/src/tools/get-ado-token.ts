import type {OpenAITool} from '@ai/openai-session';
import {AdoTokenStore} from '../stores/ado-token-store.js';

export const getAdoToken: OpenAITool<Record<string, never>> = {
  definition: {
    type: 'function',
    function: {
      name: 'get_ado_token',
      description: `Get the Azure DevOps authentication token.

Use this token as the 'token' parameter for all Azure DevOps API tools.

Returns: The Azure DevOps access token string.`,
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  handler: async () => {
    const token = AdoTokenStore.get();
    if (!token) {
      throw new Error('Azure DevOps token not available');
    }
    return token;
  },
};
