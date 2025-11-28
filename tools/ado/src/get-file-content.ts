import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {isBinaryBase64} from '@helpers/binary-utils';
import {GitVersionType} from 'azure-devops-node-api/interfaces/GitInterfaces.js';
import {createGitClient, type AdoBaseParams} from './helpers/client.js';

export interface GetFileContentParams extends AdoBaseParams {
  filePath: string;
  ref?: string;
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'ado_get_file_content',
    description: `Get the content of a text file at a specific commit or branch.

Returns: The file content as a string. Returns an error JSON for binary files.`,
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
        filePath: {
          type: 'string',
          description: 'Path to the file within the repository.',
        },
        ref: {
          type: 'string',
          description:
            'Commit SHA or branch name. Defaults to the default branch.',
        },
      },
      required: ['organization', 'project', 'repository', 'token', 'filePath'],
    },
  },
};

export const handler: ToolFunction<GetFileContentParams> = async (args) => {
  const gitApi = await createGitClient(args.organization, args.token);

  const versionDescriptor = args.ref
    ? {version: args.ref, versionType: GitVersionType.Commit}
    : undefined;

  const contentStream = await gitApi.getItemText(
    args.repository,
    args.filePath,
    args.project,
    undefined, // scopePath
    undefined, // recursionLevel
    undefined, // includeContentMetadata
    undefined, // latestProcessedChange
    undefined, // download
    versionDescriptor,
    true, // includeContent
  );

  // Read stream to string
  const chunks: Buffer[] = [];
  for await (const chunk of contentStream) {
    chunks.push(Buffer.from(chunk));
  }
  const content = Buffer.concat(chunks).toString('utf-8');

  // Check if content appears to be binary (contains null bytes or non-text chars)
  const base64Content = Buffer.from(content).toString('base64');
  if (isBinaryBase64(base64Content)) {
    return JSON.stringify({
      error: 'File is binary',
      path: args.filePath,
    });
  }

  return content;
};
