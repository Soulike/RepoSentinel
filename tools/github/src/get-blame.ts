import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '@ai/openai-session';
import {createGraphQL, type GitHubBaseParams} from './github-helpers.js';

export interface BlameLine {
  lineNumber: number;
  hash: string;
  author: string;
  date: string;
  content: string;
}

export interface GetBlameParams extends GitHubBaseParams {
  filePath: string;
  ref?: string;
  startLine?: number;
  endLine?: number;
}

interface BlameRange {
  startingLine: number;
  endingLine: number;
  commit: {
    oid: string;
    abbreviatedOid: string;
    author: {
      name: string;
      date: string;
    };
    message: string;
  };
}

interface BlameQueryResponse {
  repository: {
    object: {
      blame: {
        ranges: BlameRange[];
      };
    } | null;
  };
}

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_blame',
    description: `Get blame information for a file, showing who last modified each line.

Returns: JSON array of blame entries with lineNumber, hash, author, date, and line content.`,
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
        filePath: {
          type: 'string',
          description: 'Path to the file within the repository.',
        },
        ref: {
          type: 'string',
          description: 'Commit SHA, branch name, or tag. Defaults to HEAD.',
        },
        startLine: {
          type: 'number',
          description: 'Optional starting line number (1-indexed).',
        },
        endLine: {
          type: 'number',
          description: 'Optional ending line number (1-indexed).',
        },
        token: {
          type: 'string',
          description:
            'GitHub token (required for blame - GraphQL API needs authentication).',
        },
      },
      required: ['owner', 'repo', 'filePath'],
    },
  },
};

const BLAME_QUERY = `
  query($owner: String!, $repo: String!, $expression: String!, $path: String!) {
    repository(owner: $owner, name: $repo) {
      object(expression: $expression) {
        ... on Commit {
          blame(path: $path) {
            ranges {
              startingLine
              endingLine
              commit {
                oid
                abbreviatedOid
                author {
                  name
                  date
                }
                message
              }
            }
          }
        }
      }
    }
  }
`;

export const handler: ToolFunction<GetBlameParams> = async (args) => {
  const graphql = createGraphQL(args.token);
  const expression = args.ref ?? 'HEAD';

  const response = await graphql<BlameQueryResponse>(BLAME_QUERY, {
    owner: args.owner,
    repo: args.repo,
    expression,
    path: args.filePath,
  });

  const blame = response.repository.object?.blame;
  if (!blame) {
    return JSON.stringify({error: 'Could not retrieve blame information'});
  }

  const result: BlameLine[] = [];

  for (const range of blame.ranges) {
    for (let line = range.startingLine; line <= range.endingLine; line++) {
      // Apply line filters if specified
      if (args.startLine && line < args.startLine) continue;
      if (args.endLine && line > args.endLine) continue;

      result.push({
        lineNumber: line,
        hash: range.commit.abbreviatedOid,
        author: range.commit.author.name,
        date: range.commit.author.date,
        content: '', // GraphQL blame doesn't include line content
      });
    }
  }

  return JSON.stringify(result);
};
