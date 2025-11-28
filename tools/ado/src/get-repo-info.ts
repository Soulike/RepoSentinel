import type {OpenAITool} from '@ai/openai-session';
import {createGitClient, type AdoBaseParams} from './helpers/client.js';

export type GetRepoInfoParams = AdoBaseParams;

export const getRepoInfo: OpenAITool<GetRepoInfoParams> = {
  definition: {
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
  },
  handler: async (args) => {
    const gitApi = await createGitClient(args.organization, args.token);
    const repo = await gitApi.getRepository(args.repository, args.project);

    return JSON.stringify({
      id: repo.id,
      name: repo.name,
      defaultBranch: repo.defaultBranch,
      project: repo.project?.name,
      size: repo.size,
      webUrl: repo.webUrl,
    });
  },
};
