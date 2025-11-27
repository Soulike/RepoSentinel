export class GitHubTokenStore {
  private static token: string | null = null;

  static set(token: string): void {
    GitHubTokenStore.token = Buffer.from(token, 'utf-8').toString('base64');
  }

  static get(): string | null {
    if (!GitHubTokenStore.token) return null;
    return Buffer.from(GitHubTokenStore.token, 'base64').toString('utf-8');
  }
}
