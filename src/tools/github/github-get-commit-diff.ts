import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../../ai/tool-registry.js';
import {GitHubClient, isGitHubError} from '../../helpers/github-client.js';

interface GitHubGetCommitDiffParams {
  owner: string;
  repo: string;
  commitHash: string;
  filePath?: string;
  token?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_commit_diff',
    description: `Get the diff content for a specific commit from GitHub.

Returns: Unified diff format string showing added lines (+) and removed lines (-). If filePath is provided, only returns diff for that file.`,
    parameters: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner (user or organization)',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        commitHash: {
          type: 'string',
          description: 'The commit hash to get the diff for',
        },
        filePath: {
          type: 'string',
          description: 'Limit diff to a specific file (optional)',
        },
        token: {
          type: 'string',
          description: 'GitHub personal access token (optional)',
        },
      },
      required: ['owner', 'repo', 'commitHash'],
    },
  },
};

export const handler: ToolFunction<GitHubGetCommitDiffParams> = async (
  params,
) => {
  const client = new GitHubClient({token: params.token});

  const result = await client.getRaw(
    `/repos/${params.owner}/${params.repo}/commits/${params.commitHash}`,
    'application/vnd.github.diff',
  );

  if (isGitHubError(result)) {
    return JSON.stringify(result);
  }

  let diff = result;

  // Filter by file path if specified
  if (params.filePath && diff) {
    const lines = diff.split('\n');
    const filteredLines: string[] = [];
    let inTargetFile = false;

    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        inTargetFile = line.includes(params.filePath);
      }
      if (inTargetFile) {
        filteredLines.push(line);
      }
    }

    diff = filteredLines.join('\n');
  }

  return diff || '(no diff content)';
};
