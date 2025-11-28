import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {adoFetch, repoBasePath} from './helpers/fetch.js';
import type {
  AdoBaseParams,
  AdoCommitDetails,
  AdoDiffResponse,
} from './helpers/types.js';

export interface GetCommitDiffParams extends AdoBaseParams {
  commitId: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'ado_get_commit_diff',
    description: `Get the diff for a specific commit showing all changes.

Returns: JSON object with change counts and list of changed files with their paths and change types.`,
    parameters: {
      type: 'object',
      properties: {
        organization: {
          type: 'string',
          description: 'Azure DevOps organization name.',
        },
        project: {
          type: 'string',
          description: 'Azure DevOps project name.',
        },
        repository: {
          type: 'string',
          description: 'Repository name or ID.',
        },
        token: {
          type: 'string',
          description: 'Bearer token for authentication.',
        },
        commitId: {
          type: 'string',
          description: 'Full or abbreviated commit SHA.',
        },
      },
      required: ['organization', 'project', 'repository', 'token', 'commitId'],
    },
  },
};

// Map ADO change type numbers to readable strings
function changeTypeToString(changeType: number): string {
  const types: Record<number, string> = {
    1: 'add',
    2: 'edit',
    4: 'encoding',
    8: 'rename',
    16: 'delete',
    32: 'undelete',
    64: 'branch',
    128: 'merge',
    256: 'lock',
    512: 'rollback',
    1024: 'sourceRename',
    2048: 'targetRename',
    4096: 'property',
  };
  return types[changeType] ?? `unknown(${changeType})`;
}

export const handler: ToolFunction<GetCommitDiffParams> = async (args) => {
  const basePath = repoBasePath(args.project, args.repository);

  // First get the commit to find its parent
  const commit = await adoFetch<AdoCommitDetails>(
    args.organization,
    `${basePath}/commits/${args.commitId}`,
    args.token,
  );

  const parentId = commit.parents?.[0];

  if (!parentId) {
    // Initial commit - no parent to diff against
    return JSON.stringify({
      commitId: args.commitId,
      message: 'Initial commit - no parent to diff against',
      changeCounts: commit.changeCounts ?? {Add: 0, Edit: 0, Delete: 0},
    });
  }

  // Get diff between parent and this commit
  const diff = await adoFetch<AdoDiffResponse>(
    args.organization,
    `${basePath}/diffs/commits`,
    args.token,
    {
      baseVersion: parentId,
      targetVersion: args.commitId,
    },
  );

  const changes = diff.changes.map((change) => ({
    path: change.item.path,
    changeType: changeTypeToString(change.changeType),
  }));

  return JSON.stringify({
    baseCommit: diff.baseCommit,
    targetCommit: diff.targetCommit,
    changeCounts: diff.changeCounts,
    allChangesIncluded: diff.allChangesIncluded,
    changes,
  });
};
