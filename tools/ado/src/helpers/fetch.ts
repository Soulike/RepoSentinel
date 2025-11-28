export type {AdoBaseParams} from './types.js';

const API_VERSION = '7.0';

/**
 * Create authorization headers for ADO API requests.
 */
export function createAdoHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Build ADO API URL with query parameters.
 */
export function buildAdoUrl(
  organization: string,
  path: string,
  params?: Record<string, string>,
): string {
  const url = new URL(`https://dev.azure.com/${organization}${path}`);
  url.searchParams.set('api-version', API_VERSION);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

/**
 * Fetch JSON from ADO API.
 */
export async function adoFetch<T>(
  organization: string,
  path: string,
  token: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = buildAdoUrl(organization, path, params);
  const response = await fetch(url, {
    headers: createAdoHeaders(token),
  });
  if (!response.ok) {
    throw new Error(
      `ADO API error: ${response.status} ${response.statusText} for ${url}`,
    );
  }
  return response.json() as Promise<T>;
}

/**
 * Fetch raw text from ADO API (for file content, diffs).
 */
export async function adoFetchRaw(
  organization: string,
  path: string,
  token: string,
  params?: Record<string, string>,
): Promise<string> {
  const url = buildAdoUrl(organization, path, params);
  const response = await fetch(url, {
    headers: {
      ...createAdoHeaders(token),
      Accept: 'text/plain',
    },
  });
  if (!response.ok) {
    throw new Error(
      `ADO API error: ${response.status} ${response.statusText} for ${url}`,
    );
  }
  return response.text();
}

/**
 * Build repository base path for ADO Git API.
 */
export function repoBasePath(project: string, repository: string): string {
  return `/${project}/_apis/git/repositories/${encodeURIComponent(repository)}`;
}
