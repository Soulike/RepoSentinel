import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {adoFetch, repoBasePath} from './helpers/fetch.js';
import type {AdoBaseParams, AdoRepository} from './helpers/types.js';

export type GetRepoInfoParams = AdoBaseParams;

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'ado_get_repo_info',
    description: `Get Azure DevOps repository information including default branch and project details.

Returns: JSON object with repository details from Azure DevOps API.`,
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
      },
      required: ['organization', 'project', 'repository', 'token'],
    },
  },
};

export const handler: ToolFunction<GetRepoInfoParams> = async (args) => {
  const path = repoBasePath(args.project, args.repository);

  const data = await adoFetch<AdoRepository>(
    args.organization,
    path,
    args.token,
  );

  return JSON.stringify({
    id: data.id,
    name: data.name,
    defaultBranch: data.defaultBranch?.replace('refs/heads/', '') ?? 'main',
    project: data.project.name,
    size: data.size,
    webUrl: data.webUrl,
  });
};
