/**
 * Common parameters for all Azure DevOps tools.
 */
export interface AdoBaseParams {
  /** Azure DevOps organization name */
  organization: string;
  /** Azure DevOps project name */
  project: string;
  /** Repository name or ID */
  repository: string;
  /** Bearer token for authentication */
  token: string;
}

/**
 * ADO API response for commits list.
 */
export interface AdoCommitsResponse {
  count: number;
  value: AdoCommit[];
}

/**
 * ADO commit object from API.
 */
export interface AdoCommit {
  commitId: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  comment: string;
  changeCounts?: {
    Add: number;
    Edit: number;
    Delete: number;
  };
  url: string;
  remoteUrl: string;
}

/**
 * ADO commit details response (includes changes).
 */
export interface AdoCommitDetails extends AdoCommit {
  changes?: AdoChange[];
  parents?: string[];
}

/**
 * ADO change object (file change in a commit).
 */
export interface AdoChange {
  item: {
    objectId: string;
    originalObjectId?: string;
    gitObjectType: string;
    commitId: string;
    path: string;
    url: string;
  };
  changeType: 'add' | 'edit' | 'delete' | 'rename' | 'sourceRename';
}

/**
 * ADO repository info response.
 */
export interface AdoRepository {
  id: string;
  name: string;
  url: string;
  project: {
    id: string;
    name: string;
    state: string;
  };
  defaultBranch: string;
  size: number;
  remoteUrl: string;
  sshUrl: string;
  webUrl: string;
}

/**
 * ADO diff response for comparing commits.
 */
export interface AdoDiffResponse {
  allChangesIncluded: boolean;
  changeCounts: {
    Add: number;
    Edit: number;
    Delete: number;
  };
  changes: AdoDiffChange[];
  commonCommit: string;
  baseCommit: string;
  targetCommit: string;
}

/**
 * ADO diff change entry.
 */
export interface AdoDiffChange {
  item: {
    objectId: string;
    originalObjectId?: string;
    gitObjectType: string;
    commitId: string;
    path: string;
    url: string;
  };
  changeType: number;
}

/**
 * ADO file content response.
 */
export interface AdoItemResponse {
  objectId: string;
  gitObjectType: string;
  commitId: string;
  path: string;
  content?: string;
  url: string;
}
