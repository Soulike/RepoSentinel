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
