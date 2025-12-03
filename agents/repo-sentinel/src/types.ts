export type RepoProvider = 'local' | 'github' | 'gerrit' | 'ado';

interface BaseConfig {
  provider: RepoProvider;
  branch: string;
  fetchHours: number;
  reportDir: string;
  subPaths: string[];
}

export interface LocalConfig extends BaseConfig {
  provider: 'local';
  repoPath: string;
}

export interface GitHubConfig extends BaseConfig {
  provider: 'github';
  owner: string;
  repo: string;
  token: string | null;
}

export interface GerritConfig extends BaseConfig {
  provider: 'gerrit';
  host: string;
  project: string;
}

export interface AdoConfig extends BaseConfig {
  provider: 'ado';
  organization: string;
  project: string;
  repository: string;
  token: string | null;
}

export type Config = LocalConfig | GitHubConfig | GerritConfig | AdoConfig;
