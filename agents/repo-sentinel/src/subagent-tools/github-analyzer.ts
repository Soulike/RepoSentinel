import type {OpenAITool} from '@ai/openai-session';
import {runAgent} from '@ai/agent';
import {ToolRegistry} from '@ai/openai-session';
import {getCommitDetails, getCommitDiff} from '@openai-tools/github';
import {
  getOpenAIApiKey,
  getOpenAIBaseURL,
  getOpenAIModel,
} from '../helpers/env-helpers.js';
import {createCommitAnalyzerSubagentSystemPrompt} from '../prompts/commit-analyzer-subagent-system-prompt.js';

export interface AnalyzeGitHubCommitParams {
  /** Repository owner (username or organization) */
  owner: string;
  /** Repository name */
  repo: string;
  /** GitHub access token */
  token: string;
  /** Commit SHA to analyze */
  commitHash: string;
}

export const analyzeGitHubCommit: OpenAITool<AnalyzeGitHubCommitParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'analyze_commit',
      description: `Analyze a GitHub commit in detail using a sub-agent.

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
          owner: {
            type: 'string',
            description: 'Repository owner (username or organization).',
          },
          repo: {
            type: 'string',
            description: 'Repository name.',
          },
          token: {
            type: 'string',
            description: 'GitHub access token.',
          },
          commitHash: {
            type: 'string',
            description: 'Commit SHA to analyze.',
          },
        },
        required: ['owner', 'repo', 'token', 'commitHash'],
      },
    },
  },
  handler: async (args): Promise<string> => {
    const registry = new ToolRegistry();
    registry.register(getCommitDetails);
    registry.register(getCommitDiff);

    // Build user prompt inline - specific to GitHub
    const userPrompt = `Analyze commit ${args.commitHash}.

Use these parameters for tool calls:
- owner: "${args.owner}"
- repo: "${args.repo}"
- commitHash: "${args.commitHash}"
- token: "${args.token}"`;

    const result = await runAgent(
      {
        apiKey: getOpenAIApiKey(),
        baseURL: getOpenAIBaseURL(),
        model: getOpenAIModel(),
        systemPrompt: createCommitAnalyzerSubagentSystemPrompt('github'),
        registry,
      },
      userPrompt,
    );

    return result.content;
  },
};
