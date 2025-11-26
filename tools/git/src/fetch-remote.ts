import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {execGit} from './git-helpers.js';

export interface FetchRemoteParams {
  repoPath: string;
  remote?: string;
  branch?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'fetch_remote',
    description: `Fetch updates from the remote repository to get the latest commits. Should be called before analyzing commits to ensure data is up to date.

Returns: JSON object with:
- success: Boolean indicating fetch succeeded
- remote: Remote name that was fetched
- branch: Branch fetched, or "all" if all branches`,
    parameters: {
      type: 'object',
      properties: {
        repoPath: {
          type: 'string',
          description: 'Absolute path to the git repository.',
        },
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
      required: ['repoPath'],
    },
  },
};

export const handler: ToolFunction<FetchRemoteParams> = async (args) => {
  const {repoPath, remote = 'origin', branch} = args;

  const gitArgs = ['fetch', remote];
  if (branch) {
    gitArgs.push(branch);
  }

  await execGit(repoPath, gitArgs);

  return JSON.stringify({success: true, remote, branch: branch ?? 'all'});
};
