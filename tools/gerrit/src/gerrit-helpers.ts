const XSSI_PREFIX = ")]}'\n";

export interface GerritBaseParams {
  host: string;
  project: string;
}

export async function gerritFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Gerrit API error: ${response.statusText}`);
  }
  const text = await response.text();

  const json = text.startsWith(XSSI_PREFIX)
    ? text.slice(XSSI_PREFIX.length)
    : text;
  return JSON.parse(json) as T;
}

export async function gerritFetchRaw(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Gerrit API error: ${response.statusText}`);
  }
  return response.text();
}

export function buildUrl(
  host: string,
  path: string,
  params?: Record<string, string>,
): string {
  const url = new URL(`https://${host}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  }
  return url.toString();
}

export function encodePathComponent(path: string): string {
  return encodeURIComponent(path).replace(/%2F/g, '%252F');
}

/**
 * Formats a Date as a Gerrit timestamp string: "YYYY-MM-DD HH:MM:SS"
 */
export function formatGerritTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

export interface GerritQueryParams {
  project: string;
  status?: string | undefined;
  branch?: string | undefined;
  after?: string | undefined;
  dir?: string | undefined;
  file?: string | undefined;
}

/**
 * Builds a Gerrit query string from query parameters.
 * Handles quoting for values that contain spaces.
 *
 * @example
 * buildGerritQuery({ project: 'chromium/src', status: 'merged', branch: 'main' })
 * // => 'project:chromium/src status:merged branch:main'
 *
 * @example
 * buildGerritQuery({ project: 'chromium/src', after: '2025-11-27 08:00:00' })
 * // => 'project:chromium/src after:"2025-11-27 08:00:00"'
 *
 * @example
 * buildGerritQuery({ project: 'chromium/src', dir: 'src/components', file: undefined })
 * // => 'project:chromium/src dir:src/components'
 */
export function buildGerritQuery(params: GerritQueryParams): string {
  return (Object.keys(params) as (keyof GerritQueryParams)[])
    .filter((key) => params[key] !== undefined)
    .map((key) => {
      const value = params[key]!;
      if (value.includes(' ')) {
        return `${key}:"${value}"`;
      }
      return `${key}:${value}`;
    })
    .join(' ');
}
