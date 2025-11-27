import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {createOctokit, type GitHubBaseParams} from './github-helpers.js';

export interface GetCommitDetailsParams extends GitHubBaseParams {
  commitHash: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_commit_details',
    description: `Get detailed information about a specific commit including changed files.

Returns: JSON commit object from GitHub API with full details and files array.`,
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

export const handler: ToolFunction<GetCommitDetailsParams> = async (args) => {
  const octokit = createOctokit(args.token);

  const {data} = await octokit.repos.getCommit({
    owner: args.owner,
    repo: args.repo,
    ref: args.commitHash,
  });

  // Map GitHub status to match git tool format
  const statusMap: Record<string, string> = {
    added: 'added',
    removed: 'deleted',
    modified: 'modified',
    renamed: 'renamed',
    copied: 'added',
    changed: 'modified',
  };

  // Extract only essential fields to match git tool output
  // Filter out files with 'unchanged' status as they have no net changes
  const files = (data.files ?? [])
    .filter((file) => file.status !== 'unchanged')
    .map((file) => ({
      path: file.filename,
      status: statusMap[file.status ?? 'modified'] ?? 'modified',
      additions: file.additions,
      deletions: file.deletions,
    }));

  const result = {
    hash: data.sha,
    author: data.commit.author?.name ?? '',
    date: data.commit.author?.date ?? '',
    message: data.commit.message,
    files,
  };

  return JSON.stringify(result);
};
