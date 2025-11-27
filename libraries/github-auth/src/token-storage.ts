export class TokenStorage {
  private static token: string | null = null;

  static get(): string | null {
    if (!TokenStorage.token) return null;
    return Buffer.from(TokenStorage.token, 'base64').toString('utf-8');
  }

  static set(token: string): void {
    TokenStorage.token = Buffer.from(token, 'utf-8').toString('base64');
  }

  static clear(): void {
    TokenStorage.token = null;
  }
}
