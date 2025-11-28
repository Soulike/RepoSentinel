import type {OpenAITool} from '@ai/openai-session';
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

export interface CompareCommitsParams extends AdoBaseParams {
  baseCommit: string;
  targetCommit: string;
}

export const compareCommits: OpenAITool<CompareCommitsParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'ado_compare_commits',
      description: `Compare two commits and get the diff between them.

Returns: JSON object with change counts and list of changed files.`,
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
          baseCommit: {
            type: 'string',
            description: 'Base commit SHA or branch name.',
          },
          targetCommit: {
            type: 'string',
            description: 'Target commit SHA or branch name.',
          },
        },
        required: [
          'organization',
          'project',
          'repository',
          'token',
          'baseCommit',
          'targetCommit',
        ],
      },
    },
  },
  handler: async (args) => {
    const gitApi = await createGitClient(args.organization, args.token);

    const baseVersion: GitBaseVersionDescriptor = {
      version: args.baseCommit,
      versionType: GitVersionType.Commit,
    };
    const targetVersion: GitTargetVersionDescriptor = {
      version: args.targetCommit,
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
      commonCommit: diff.commonCommit,
      changeCounts: diff.changeCounts,
      allChangesIncluded: diff.allChangesIncluded,
      changes,
    });
  },
};
