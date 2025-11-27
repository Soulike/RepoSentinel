import {gerritFetch, buildUrl} from './fetch.js';

interface ChangeInfoResponse {
  id: string;
  project: string;
  branch: string;
  change_id: string;
  subject: string;
  status: string;
  created: string;
  updated: string;
  insertions: number;
  deletions: number;
  _number: number;
  owner: {name?: string};
}

export interface ChangeInfo {
  number: number;
  changeId: string;
  subject: string;
  branch: string;
  updated: string;
  insertions: number;
  deletions: number;
  owner: string;
}

/**
 * Fetches changes from Gerrit API and maps to simplified format.
 */
export async function fetchChanges(
  host: string,
  query: string,
): Promise<ChangeInfo[]> {
  const url = buildUrl(host, '/changes/', {
    q: [query],
    n: ['100'],
  });

  const data = await gerritFetch<ChangeInfoResponse[]>(url);

  return data.map((change) => ({
    number: change._number,
    changeId: change.change_id,
    subject: change.subject,
    branch: change.branch,
    updated: change.updated,
    insertions: change.insertions,
    deletions: change.deletions,
    owner: change.owner.name ?? '',
  }));
}
