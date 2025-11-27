import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {createOctokit, type GitHubBaseParams} from './github-helpers.js';

export interface CompareCommitsParams extends GitHubBaseParams {
  base: string;
  head: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_compare_commits',
    description: `Compare two commits, branches, or tags to see the diff between them.

Returns: JSON object with comparison summary and list of changed files.`,
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
        base: {
          type: 'string',
          description: 'Base commit SHA, branch name, or tag to compare from.',
        },
        head: {
          type: 'string',
          description: 'Head commit SHA, branch name, or tag to compare to.',
        },
        token: {
          type: 'string',
          description:
            'Optional GitHub token for private repos or higher rate limits.',
        },
      },
      required: ['owner', 'repo', 'base', 'head'],
    },
  },
};

export const handler: ToolFunction<CompareCommitsParams> = async (args) => {
  const octokit = createOctokit(args.token);

  const {data} = await octokit.repos.compareCommits({
    owner: args.owner,
    repo: args.repo,
    base: args.base,
    head: args.head,
  });

  const files = (data.files ?? [])
    .filter((file) => file.status !== 'unchanged')
    .map((file) => ({
      path: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
    }));

  const commits = data.commits.map((commit) => ({
    hash: commit.sha,
    shortHash: commit.sha.slice(0, 7),
    author: commit.commit.author?.name ?? '',
    date: commit.commit.author?.date ?? '',
    // First line only (subject) to match git's %s format
    message: commit.commit.message.split('\n')[0] ?? '',
  }));

  const result = {
    status: data.status,
    aheadBy: data.ahead_by,
    behindBy: data.behind_by,
    totalCommits: data.total_commits,
    commits,
    files,
  };

  return JSON.stringify(result);
};
