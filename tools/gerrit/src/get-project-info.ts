import type {OpenAITool} from '@ai/openai-session';
import {gerritFetch, buildUrl} from './helpers/fetch.js';

export interface GetProjectInfoParams {
  host: string;
  project: string;
}

interface ProjectInfo {
  id: string;
  name: string;
  parent?: string;
  description?: string;
  state?: string;
  web_links?: Array<{name: string; url: string}>;
}

export const getProjectInfo: OpenAITool<GetProjectInfoParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'gerrit_get_project_info',
      description: `Get information about a Gerrit project.

Returns: JSON object with project metadata.`,
      parameters: {
        type: 'object',
        properties: {
          host: {
            type: 'string',
            description:
              'Gerrit host (e.g., chromium-review.googlesource.com).',
          },
          project: {
            type: 'string',
            description: 'Project name (e.g., chromium/src).',
          },
        },
        required: ['host', 'project'],
      },
    },
  },
  handler: async (args) => {
    const encodedProject = encodeURIComponent(args.project);
    const url = buildUrl(args.host, `/projects/${encodedProject}`);

    const data = await gerritFetch<ProjectInfo>(url);

    return JSON.stringify({
      id: data.id,
      name: data.name,
      parent: data.parent ?? null,
      description: data.description ?? null,
      state: data.state ?? 'ACTIVE',
      webLinks: data.web_links ?? [],
    });
  },
};
