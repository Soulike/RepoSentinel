export function createUserPrompt(): string {
  const now = new Date().toISOString();

  return `Please analyze the repository for recent changes and generate a report.

Current time: ${now}

Start by getting the configuration, then follow your workflow to analyze all commits and generate a comprehensive report.`;
}
