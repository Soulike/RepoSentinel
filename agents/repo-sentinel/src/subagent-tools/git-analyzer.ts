import type {OpenAITool} from '@ai/openai-session';
import {runAgent} from '@ai/agent';
import {ToolRegistry} from '@ai/openai-session';
import {getCommitDetails, getCommitDiff} from '@openai-tools/git';
import {
  getOpenAIApiKey,
  getOpenAIBaseURL,
  getOpenAIModel,
} from '../helpers/env-helpers.js';
import {createCommitAnalyzerSubagentSystemPrompt} from '../prompts/commit-analyzer-subagent-system-prompt.js';

export interface AnalyzeGitCommitParams {
  /** Absolute path to the git repository */
  repoPath: string;
  /** Commit hash to analyze */
  commitHash: string;
}

export const analyzeGitCommit: OpenAITool<AnalyzeGitCommitParams> = {
  definition: {
    type: 'function',
    function: {
      name: 'analyze_commit',
      description: `Analyze a local git commit in detail using a sub-agent.

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
          repoPath: {
            type: 'string',
            description: 'Absolute path to the git repository.',
          },
          commitHash: {
            type: 'string',
            description: 'The commit hash to analyze.',
          },
        },
        required: ['repoPath', 'commitHash'],
      },
    },
  },
  handler: async (args): Promise<string> => {
    const registry = new ToolRegistry();
    registry.register(getCommitDetails);
    registry.register(getCommitDiff);

    // Build user prompt inline - specific to local git
    const userPrompt = `Analyze commit ${args.commitHash}.

Use these parameters for tool calls:
- repoPath: "${args.repoPath}"
- commitHash: "${args.commitHash}"`;

    const result = await runAgent(
      {
        apiKey: getOpenAIApiKey(),
        baseURL: getOpenAIBaseURL(),
        model: getOpenAIModel(),
        systemPrompt: createCommitAnalyzerSubagentSystemPrompt('local'),
        registry,
      },
      userPrompt,
    );

    return result.content;
  },
};
