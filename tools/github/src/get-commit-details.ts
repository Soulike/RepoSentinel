import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {createOctokit, type GitHubBaseParams} from './github-helpers.js';

export interface ChangedFile {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  previousPath?: string | undefined;
}

export interface CommitDetails {
  hash: string;
  author: string;
  date: string;
  message: string;
  files: ChangedFile[];
}

export interface GetCommitDetailsParams extends GitHubBaseParams {
  commitHash: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_commit_details',
    description: `Get detailed information about a specific commit including changed files.

Returns: JSON with hash, author, date, message, and array of changed files with path, status, additions, and deletions.`,
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

function mapStatus(
  status: string | undefined,
): 'added' | 'modified' | 'deleted' | 'renamed' {
  switch (status) {
    case 'added':
      return 'added';
    case 'removed':
      return 'deleted';
    case 'renamed':
      return 'renamed';
    default:
      return 'modified';
  }
}

export const handler: ToolFunction<GetCommitDetailsParams> = async (args) => {
  const octokit = createOctokit(args.token);

  const {data: commit} = await octokit.repos.getCommit({
    owner: args.owner,
    repo: args.repo,
    ref: args.commitHash,
  });

  const files: ChangedFile[] =
    commit.files?.map((f) => ({
      path: f.filename,
      status: mapStatus(f.status),
      additions: f.additions,
      deletions: f.deletions,
      previousPath: f.previous_filename,
    })) ?? [];

  const result: CommitDetails = {
    hash: commit.sha,
    author: commit.commit.author?.name ?? 'Unknown',
    date: commit.commit.author?.date ?? '',
    message: commit.commit.message,
    files,
  };

  return JSON.stringify(result);
};
