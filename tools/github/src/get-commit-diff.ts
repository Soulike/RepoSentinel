import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {createOctokit, type GitHubBaseParams} from './github-helpers.js';
import assert from 'node:assert';

export interface GetCommitDiffParams extends GitHubBaseParams {
  commitHash: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_commit_diff',
    description: `Get the diff/patch for a specific commit.

Returns: Unified diff format string showing all changes made in the commit.`,
    parameters: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner (username or organization).',
        },
        repo: {
          type: 'string',
          description: 'Repository name.',
        },
        commitHash: {
          type: 'string',
          description: 'Full or abbreviated commit SHA.',
        },
        token: {
          type: 'string',
          description:
            'Optional GitHub token for private repos or higher rate limits.',
        },
      },
      required: ['owner', 'repo', 'commitHash'],
    },
  },
};

export const handler: ToolFunction<GetCommitDiffParams> = async (args) => {
  const octokit = createOctokit(args.token);

  const {data: diff} = await octokit.repos.getCommit({
    owner: args.owner,
    repo: args.repo,
    ref: args.commitHash,
    mediaType: {
      format: 'diff',
    },
  });

  assert(
    typeof diff === 'string',
    'GitHub API is responding with unexpected diff result.',
  );

  return diff || '(no diff content)';
};
