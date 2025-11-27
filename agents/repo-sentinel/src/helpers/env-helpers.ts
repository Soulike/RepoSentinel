import {readFileSync} from 'node:fs';
import type {RepoProvider} from '../types.js';

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
  const model = process.env['OPENAI_MODEL'];
  if (!model) {
    throw new Error('OPENAI_MODEL environment variable is not set');
  }
  return model;
}

// Provider configuration
export function getRepoProvider(): RepoProvider {
  const provider = process.env['REPO_PROVIDER'];
  if (provider !== 'local' && provider !== 'github') {
    throw new Error('REPO_PROVIDER must be "local" or "github"');
  }
  return provider;
}

// Local provider configuration
export function getRepoPath(): string {
  const repoPath = process.env['REPO_PATH'];
  if (!repoPath) {
    throw new Error('REPO_PATH environment variable is not set');
  }
  return repoPath;
}

// GitHub provider configuration
export function getGitHubOwner(): string {
  const owner = process.env['GITHUB_OWNER'];
  if (!owner) {
    throw new Error('GITHUB_OWNER environment variable is not set');
  }
  return owner;
}

export function getGitHubRepo(): string {
  const repo = process.env['GITHUB_REPO'];
  if (!repo) {
    throw new Error('GITHUB_REPO environment variable is not set');
  }
  return repo;
}

// Agent configuration

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
    return [];
  }
  return subPath.split(',').map((p) => p.trim());
}

export function getCustomPrompt(): string | undefined {
  const filePath = process.env['CUSTOM_PROMPT_FILE'];
  if (!filePath) return undefined;

  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read CUSTOM_PROMPT_FILE: ${filePath}`, {
      cause: error,
    });
  }
}
