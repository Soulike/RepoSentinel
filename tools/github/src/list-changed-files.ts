import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {createOctokit, type GitHubBaseParams} from './github-helpers.js';

export interface ListChangedFilesParams extends GitHubBaseParams {
  branch: string;
  hours: number;
  path?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_list_changed_files',
    description: `List all unique files changed in commits within the last N hours on a branch.

Returns: JSON array of unique file path strings.`,
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
        branch: {
          type: 'string',
          description: 'Branch name to check for changed files.',
        },
        hours: {
          type: 'number',
          description: 'Number of hours to look back for changes.',
        },
        path: {
          type: 'string',
          description: 'Optional path prefix to filter files.',
        },
        token: {
          type: 'string',
          description:
            'Optional GitHub token for private repos or higher rate limits.',
        },
      },
      required: ['owner', 'repo', 'branch', 'hours'],
    },
  },
};

export const handler: ToolFunction<ListChangedFilesParams> = async (args) => {
  const octokit = createOctokit(args.token);

  const since = new Date(
    Date.now() - args.hours * 60 * 60 * 1000,
  ).toISOString();

  // Get commits in the time range
  const {data: commits} = await octokit.repos.listCommits({
    owner: args.owner,
    repo: args.repo,
    sha: args.branch,
    since,
    per_page: 100,
    ...(args.path && {path: args.path}),
  });

  // Collect all unique file paths
  const files = new Set<string>();

  // Fetch details for each commit to get changed files
  await Promise.all(
    commits.map(async (commit) => {
      const {data: details} = await octokit.repos.getCommit({
        owner: args.owner,
        repo: args.repo,
        ref: commit.sha,
      });

      for (const file of details.files ?? []) {
        if (!args.path || file.filename.startsWith(args.path)) {
          files.add(file.filename);
        }
      }
    }),
  );

  return JSON.stringify(Array.from(files).sort());
};
