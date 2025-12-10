import type {OpenAITool} from '@ai/openai-session';
import {runAgent} from '@ai/agent';
import {ToolRegistry} from '@ai/openai-session';
import {getCommitDetails, getCommitDiff} from '@openai-tools/ado';
import {
  getOpenAIApiKey,
  getOpenAIBaseURL,
  getOpenAIModel,
} from '../helpers/env-helpers.js';
import {createCommitAnalyzerSubagentSystemPrompt} from '../prompts/commit-analyzer-subagent-system-prompt.js';

export interface AnalyzeAdoCommitParams {
  /** Azure DevOps organization name */
  organization: string;
  /** Azure DevOps project name */
  project: string;
  /** Repository name */
  repository: string;
  /** Azure DevOps access token */
  token: string;
  /** Commit ID to analyze */
  commitId: string;
}

export const analyzeAdoCommit: OpenAITool<AnalyzeAdoCommitParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'analyze_commit',
      description: `Analyze an Azure DevOps commit in detail using a sub-agent.

Use this tool for commits that need detailed analysis:
- Breaking changes
- New features
- Security-related changes
- Large commits (5+ files or 100+ lines)
- Changes to critical files

Returns a JSON object with classification, impact assessment, and key changes.`,
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
            description: 'Repository name.',
          },
          token: {
            type: 'string',
            description: 'Azure DevOps access token.',
          },
          commitId: {
            type: 'string',
            description: 'Commit ID to analyze.',
          },
        },
        required: [
          'organization',
          'project',
          'repository',
          'token',
          'commitId',
        ],
      },
    },
  },
  handler: async (args): Promise<string> => {
    const registry = new ToolRegistry();
    registry.register(getCommitDetails);
    registry.register(getCommitDiff);

    // Build user prompt inline - specific to Azure DevOps
    const userPrompt = `Analyze commit ${args.commitId}.

Use these parameters for tool calls:
- organization: "${args.organization}"
- project: "${args.project}"
- repository: "${args.repository}"
- token: "${args.token}"
- commitId: "${args.commitId}"`;

    const result = await runAgent(
      {
        apiKey: getOpenAIApiKey(),
        baseURL: getOpenAIBaseURL(),
        model: getOpenAIModel(),
        systemPrompt: createCommitAnalyzerSubagentSystemPrompt('ado'),
        registry,
      },
      userPrompt,
    );

    return result.content;
  },
};
