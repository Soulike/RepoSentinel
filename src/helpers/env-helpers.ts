export function getRepoPath(): string {
  const repoPath = process.env['REPO_PATH'];
  if (!repoPath) {
    throw new Error('REPO_PATH environment variable is not set');
  }
  return repoPath;
}

export function getBranch(): string {
  return process.env['BRANCH'] ?? 'main';
}

export function getCheckIntervalHours(): number {
  const hours = process.env['CHECK_INTERVAL_HOURS'];
  return hours ? parseInt(hours, 10) : 1;
}
