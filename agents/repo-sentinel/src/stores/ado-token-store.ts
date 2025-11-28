export class AdoTokenStore {
  private static token: string | null = null;

  static set(token: string): void {
    AdoTokenStore.token = token;
  }

  static get(): string | null {
    return AdoTokenStore.token;
  }
}
