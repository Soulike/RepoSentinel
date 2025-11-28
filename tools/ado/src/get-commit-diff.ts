import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {
  GitVersionType,
  type GitBaseVersionDescriptor,
  type GitTargetVersionDescriptor,
} from 'azure-devops-node-api/interfaces/GitInterfaces.js';
import {
  changeTypeToString,
  createGitClient,
  type AdoBaseParams,
} from './helpers/client.js';

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

export const handler: ToolFunction<GetCommitDiffParams> = async (args) => {
  const gitApi = await createGitClient(args.organization, args.token);

  // First get the commit to find its parent
  const commit = await gitApi.getCommit(
    args.commitId,
    args.repository,
    args.project,
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
  const baseVersion: GitBaseVersionDescriptor = {
    version: parentId,
    versionType: GitVersionType.Commit,
  };
  const targetVersion: GitTargetVersionDescriptor = {
    version: args.commitId,
    versionType: GitVersionType.Commit,
  };

  const diff = await gitApi.getCommitDiffs(
    args.repository,
    args.project,
    true, // diffCommonCommit
    undefined, // top
    undefined, // skip
    baseVersion,
    targetVersion,
  );

  const changes = (diff.changes ?? []).map((change) => ({
    path: change.item?.path,
    changeType: change.changeType
      ? changeTypeToString(change.changeType)
      : 'unknown',
  }));

  return JSON.stringify({
    baseCommit: diff.baseCommit,
    targetCommit: diff.targetCommit,
    changeCounts: diff.changeCounts,
    allChangesIncluded: diff.allChangesIncluded,
    changes,
  });
};
