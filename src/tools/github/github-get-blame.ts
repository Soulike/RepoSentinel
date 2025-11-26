import type {ChatCompletionFunctionTool} from 'openai/resources/chat/completions';
import type {ToolFunction} from '../../ai/tool-registry.js';
import {GitHubClient, isGitHubError} from '../../helpers/github-client.js';

interface GitHubGetBlameParams {
  owner: string;
  repo: string;
  filePath: string;
  ref?: string;
  startLine?: number;
  endLine?: number;
  token: string;
}

interface BlameRange {
  startingLine: number;
  endingLine: number;
  commit: {
    oid: string;
    author: {
      name: string;
      date: string;
    };
    message: string;
  };
}

interface GitHubBlameResponse {
  repository: {
    object: {
      blame: {
        ranges: BlameRange[];
      };
    } | null;
  };
}

const BLAME_QUERY = `
query($owner: String!, $repo: String!, $ref: String!, $path: String!) {
  repository(owner: $owner, name: $repo) {
    object(expression: $ref) {
      ... on Commit {
        blame(path: $path) {
          ranges {
            startingLine
            endingLine
            commit {
              oid
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

export const definition: ChatCompletionFunctionTool = {
  type: 'function',
  function: {
    name: 'github_get_blame',
    description: `Show who last modified each line of a file using GitHub's GraphQL API. Requires authentication.

Returns: JSON array of line objects with:
- lineNumber: 1-based line number
- hash: Short commit hash (7 chars)
- author: Author who last modified this line
- date: ISO 8601 timestamp`,
    parameters: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner (user or organization)',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        filePath: {
          type: 'string',
          description: 'Path to the file relative to the repository root',
        },
        ref: {
          type: 'string',
          description: 'Branch, tag, or commit SHA (defaults to HEAD)',
        },
        startLine: {
          type: 'number',
          description: 'Starting line number (1-based, optional)',
        },
        endLine: {
          type: 'number',
          description: 'Ending line number (1-based, optional)',
        },
        token: {
          type: 'string',
          description:
            'GitHub personal access token (REQUIRED for GraphQL API)',
        },
      },
      required: ['owner', 'repo', 'filePath', 'token'],
    },
  },
};

export const handler: ToolFunction<GitHubGetBlameParams> = async (params) => {
  const client = new GitHubClient({token: params.token});

  const ref = params.ref ?? 'HEAD';

  const result = await client.graphql<GitHubBlameResponse>(BLAME_QUERY, {
    owner: params.owner,
    repo: params.repo,
    ref,
    path: params.filePath,
  });

  if (isGitHubError(result)) {
    return JSON.stringify(result);
  }

  if (!result.repository.object) {
    return JSON.stringify({
      error: true,
      message: `Could not find ref "${ref}" or file "${params.filePath}"`,
    });
  }

  const ranges = result.repository.object.blame.ranges;

  // Expand ranges into individual lines
  const lines: Array<{
    lineNumber: number;
    hash: string;
    author: string;
    date: string;
  }> = [];

  for (const range of ranges) {
    for (let line = range.startingLine; line <= range.endingLine; line++) {
      // Filter by startLine/endLine if specified
      if (params.startLine && line < params.startLine) continue;
      if (params.endLine && line > params.endLine) continue;

      lines.push({
        lineNumber: line,
        hash: range.commit.oid.substring(0, 7),
        author: range.commit.author.name,
        date: range.commit.author.date,
      });
    }
  }

  return JSON.stringify(lines);
};
