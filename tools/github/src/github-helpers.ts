import {Octokit} from '@octokit/rest';

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
 * Common parameters for all GitHub tools.
 */
export interface GitHubBaseParams {
  owner: string;
  repo: string;
  token?: string;
}
