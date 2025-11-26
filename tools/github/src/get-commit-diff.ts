import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {createOctokit, type GitHubBaseParams} from './github-helpers.js';

export interface GetCommitDiffParams extends GitHubBaseParams {
  commitHash: string;
  filePath?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_commit_diff',
    description: `Get the diff/patch for a specific commit.

Returns: Unified diff format string showing the changes made in the commit.`,
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
        filePath: {
          type: 'string',
          description: 'Optional file path to get diff for only that file.',
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

  // When requesting diff format, data is returned as a string
  const diffContent = diff as unknown as string;

  if (!args.filePath) {
    return diffContent || '(no diff content)';
  }

  // Filter diff to only include the specified file
  const lines = diffContent.split('\n');
  const result: string[] = [];
  let inTargetFile = false;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      inTargetFile = line.includes(args.filePath);
    }
    if (inTargetFile) {
      result.push(line);
    }
  }

  return result.join('\n') || '(no diff content for specified file)';
};
