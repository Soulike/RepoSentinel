import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../ai/tool-registry.js';
import {execGit} from '../helpers/git-helpers.js';

export interface FetchRemoteParams {
  remote?: string;
  branch?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'fetch_remote',
    description:
      'Fetch updates from the remote repository to get the latest commits. Should be called before analyzing commits to ensure data is up to date.',
    parameters: {
      type: 'object',
      properties: {
        remote: {
          type: 'string',
          description: 'Remote name to fetch from. Defaults to "origin".',
        },
        branch: {
          type: 'string',
          description:
            'Specific branch to fetch. If omitted, fetches all branches.',
        },
      },
    },
  },
};

export const handler: ToolFunction<FetchRemoteParams> = async (args) => {
  const {remote = 'origin', branch} = args;

  const gitArgs = ['fetch', remote];
  if (branch) {
    gitArgs.push(branch);
  }

  await execGit(gitArgs);

  return JSON.stringify({success: true, remote, branch: branch ?? 'all'});
};
