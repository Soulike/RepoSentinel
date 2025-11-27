export class GitHubTokenStore {
  private static token: string | null = null;

  static set(token: string): void {
    GitHubTokenStore.token = token;
  }

  static get(): string | null {
    return GitHubTokenStore.token;
  }
}
