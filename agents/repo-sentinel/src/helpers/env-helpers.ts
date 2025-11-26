// OpenAI configuration
export function getOpenAIApiKey(): string {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return apiKey;
}

export function getOpenAIBaseURL(): string | undefined {
  return process.env['OPENAI_BASE_URL'];
}

export function getOpenAIModel(): string {
  return process.env['OPENAI_MODEL'] ?? 'gpt-4';
}

// Agent configuration
export function getRepoPath(): string {
  const repoPath = process.env['REPO_PATH'];
  if (!repoPath) {
    throw new Error('REPO_PATH environment variable is not set');
  }
  return repoPath;
}

export function getBranch(): string {
  const branch = process.env['BRANCH'];
  if (!branch) {
    throw new Error('BRANCH environment variable is not set');
  }
  return branch;
}

export function getCheckIntervalHours(): number {
  const hours = process.env['CHECK_INTERVAL_HOURS'];
  if (!hours) {
    throw new Error('CHECK_INTERVAL_HOURS environment variable is not set');
  }
  return parseInt(hours, 10);
}

export function getReportDir(): string {
  const reportDir = process.env['REPORT_DIR'];
  if (!reportDir) {
    throw new Error('REPORT_DIR environment variable is not set');
  }
  return reportDir;
}

export function getSubPath(): string[] {
  const subPath = process.env['SUB_PATH'];
  if (!subPath) {
    throw new Error('SUB_PATH environment variable is not set');
  }
  return subPath.split(',').map((p) => p.trim());
}
