import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {adoFetch, repoBasePath} from './helpers/fetch.js';
import type {AdoBaseParams, AdoDiffResponse} from './helpers/types.js';

export interface CompareCommitsParams extends AdoBaseParams {
  baseCommit: string;
  targetCommit: string;
}

export const definition: ChatCompletionFunctionTool = {
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

export const handler: ToolFunction<CompareCommitsParams> = async (args) => {
  const basePath = repoBasePath(args.project, args.repository);

  const diff = await adoFetch<AdoDiffResponse>(
    args.organization,
    `${basePath}/diffs/commits`,
    args.token,
    {
      baseVersion: args.baseCommit,
      targetVersion: args.targetCommit,
    },
  );

  const changes = diff.changes.map((change) => ({
    path: change.item.path,
    changeType: changeTypeToString(change.changeType),
  }));

  return JSON.stringify({
    baseCommit: diff.baseCommit,
    targetCommit: diff.targetCommit,
    commonCommit: diff.commonCommit,
    changeCounts: diff.changeCounts,
    allChangesIncluded: diff.allChangesIncluded,
    changes,
  });
};
