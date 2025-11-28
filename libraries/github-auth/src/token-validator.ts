const GITHUB_USER_API = 'https://api.github.com/user';

/**
 * Validates a GitHub token by making a request to the GitHub API.
 *
 * @param token - GitHub access token to validate
 * @returns True if the token is valid, false otherwise
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(GITHUB_USER_API, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
