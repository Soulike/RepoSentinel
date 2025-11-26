import {Octokit} from '@octokit/rest';
import {graphql} from '@octokit/graphql';

/**
 * Create an Octokit REST client with optional authentication.
 *
 * @param token - Optional GitHub personal access token
 * @returns Configured Octokit instance
 */
export function createOctokit(token?: string): Octokit {
  return new Octokit({
    auth: token,
  });
}

/**
 * Create an authenticated GraphQL client for GitHub API.
 *
 * @param token - Optional GitHub personal access token
 * @returns Configured graphql function
 */
export function createGraphQL(token?: string) {
  return graphql.defaults({
    headers: {
      authorization: token ? `token ${token}` : '',
    },
  });
}

/**
 * Common parameters for all GitHub tools.
 */
export interface GitHubBaseParams {
  owner: string;
  repo: string;
  token?: string;
}
