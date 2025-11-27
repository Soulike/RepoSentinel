import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {gerritFetch, buildUrl} from './gerrit-helpers.js';

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

export const definition: ChatCompletionFunctionTool = {
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
          description: 'Gerrit host (e.g., chromium-review.googlesource.com).',
        },
        project: {
          type: 'string',
          description: 'Project name (e.g., chromium/src).',
        },
      },
      required: ['host', 'project'],
    },
  },
};

export const handler: ToolFunction<GetProjectInfoParams> = async (args) => {
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
};
