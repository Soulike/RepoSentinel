const GITHUB_API_URL = 'https://api.github.com';

export interface GitHubClientOptions {
  token?: string | undefined;
}

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: string;
}

export interface GitHubErrorResponse {
  error: true;
  status: number;
  message: string;
  rateLimitInfo?: RateLimitInfo;
}

export class GitHubClient {
  private token: string | undefined;

  constructor(options?: GitHubClientOptions) {
    this.token = options?.token;
  }

  private getHeaders(accept?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'RepoSentinel',
      Accept: accept ?? 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private parseRateLimitHeaders(response: Response): RateLimitInfo {
    const remaining = parseInt(
      response.headers.get('X-RateLimit-Remaining') ?? '0',
      10,
    );
    const limit = parseInt(
      response.headers.get('X-RateLimit-Limit') ?? '0',
      10,
    );
    const resetTimestamp = parseInt(
      response.headers.get('X-RateLimit-Reset') ?? '0',
      10,
    );
    const resetAt = new Date(resetTimestamp * 1000).toISOString();
    return {remaining, limit, resetAt};
  }

  private async handleError(response: Response): Promise<GitHubErrorResponse> {
    const rateLimitInfo = this.parseRateLimitHeaders(response);
    let message = `GitHub API error: ${response.status} ${response.statusText}`;

    try {
      const body = (await response.json()) as {message?: string};
      if (body.message) {
        message = body.message;
      }
    } catch {
      // Ignore JSON parse errors
    }

    if (response.status === 403 && rateLimitInfo.remaining === 0) {
      message = `Rate limit exceeded. Resets at ${rateLimitInfo.resetAt}`;
    }

    return {
      error: true,
      status: response.status,
      message,
      rateLimitInfo,
    };
  }

  async get<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<T | GitHubErrorResponse> {
    const url = new URL(path, GITHUB_API_URL);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      return this.handleError(response);
    }

    return response.json() as Promise<T>;
  }

  async getRaw(
    path: string,
    accept: string,
  ): Promise<string | GitHubErrorResponse> {
    const url = new URL(path, GITHUB_API_URL);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(accept),
    });

    if (!response.ok) {
      return this.handleError(response);
    }

    return response.text();
  }

  async graphql<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T | GitHubErrorResponse> {
    if (!this.token) {
      return {
        error: true,
        status: 401,
        message: 'GraphQL API requires authentication. Please provide a token.',
      };
    }

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({query, variables}),
    });

    if (!response.ok) {
      return this.handleError(response);
    }

    const result = (await response.json()) as {
      data?: T;
      errors?: Array<{message: string}>;
    };
    if (result.errors && result.errors.length > 0) {
      return {
        error: true,
        status: 200,
        message: result.errors.map((e) => e.message).join(', '),
      };
    }

    return result.data as T;
  }
}

export function isGitHubError(result: unknown): result is GitHubErrorResponse {
  return typeof result === 'object' && result !== null && 'error' in result;
}
