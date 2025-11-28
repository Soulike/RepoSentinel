import type {getAdoAccessToken} from '@helpers/ado-auth';

type AccessToken = Awaited<ReturnType<typeof getAdoAccessToken>>;

export class AdoTokenStore {
  private static tokenData: AccessToken | null = null;

  static set(token: AccessToken): void {
    AdoTokenStore.tokenData = token;
  }

  static get(): string | null {
    if (!AdoTokenStore.tokenData) {
      return null;
    }

    const now = Date.now();
    const {token, expiresOnTimestamp, refreshAfterTimestamp} =
      AdoTokenStore.tokenData;

    // Check if token should be refreshed or has expired
    const shouldRefresh =
      !!refreshAfterTimestamp && now >= refreshAfterTimestamp;
    const isExpired = now >= expiresOnTimestamp;

    if (shouldRefresh || isExpired) {
      AdoTokenStore.tokenData = null;
      return null;
    }

    return token;
  }
}
