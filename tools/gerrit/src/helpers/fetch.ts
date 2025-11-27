const XSSI_PREFIX = ")]}'\n";

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
  params?: Record<string, string[]>,
): string {
  const url = new URL(`https://${host}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, values]) => {
      values.forEach((v) => url.searchParams.append(k, v));
    });
  }
  return url.toString();
}
