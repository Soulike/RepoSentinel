export type RepoProvider = 'local' | 'github';

interface BaseConfig {
  provider: RepoProvider;
  branch: string;
  checkIntervalHours: number;
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
  token?: string | undefined;
}

export type Config = LocalConfig | GitHubConfig;
