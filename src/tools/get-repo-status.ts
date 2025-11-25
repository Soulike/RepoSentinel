import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../ai/tool-registry.js';
import {execGit} from '../helpers/git-helpers.js';

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'get_repo_status',
    description: `Get the current repository status including branch, remote tracking info, and file changes.

Returns: Raw git status output as string, showing current branch, tracking info, staged/unstaged changes, and untracked files.`,
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export const handler: ToolFunction<Record<string, never>> = async () => {
  const status = await execGit(['status']);
  return status;
};
