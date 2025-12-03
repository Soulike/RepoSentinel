import {readdir} from 'fs/promises';
import {getReportDir} from './env-helpers.js';

/**
 * Generate a report filename with ISO timestamp prefix.
 * Format: 2025-12-03T14-30-00Z-<project>-<branch>-<topic>.md
 */
export function generateReportFilename(
  project: string,
  branch: string,
  topic: string,
  date: Date,
): string {
  // Use ISO format: 2025-12-03T14-30-00Z (remove milliseconds, replace colons with hyphens)
  const isoTimestamp = date
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
    .replace(/:/g, '-');

  // Sanitize inputs: lowercase, replace spaces/special chars with hyphens
  const sanitize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');

  return `${isoTimestamp}-${sanitize(project)}-${sanitize(branch)}-${sanitize(topic)}.md`;
}

/**
 * Parse timestamp from report filename.
 * Expected format: 2025-12-03T14-30-00Z-<rest>.md
 * Returns null if parsing fails.
 */
export function parseReportTimestamp(filename: string): Date | null {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)-/);
  if (!match) return null;

  // Convert back to ISO format: replace hyphens with colons in time part
  const isoString = match[1]!.replace(
    /T(\d{2})-(\d{2})-(\d{2})Z/,
    'T$1:$2:$3Z',
  );
  const date = new Date(isoString);

  return isNaN(date.getTime()) ? null : date;
}

/**
 * Get report filenames sorted by timestamp in filename (most recent first).
 */
export async function getReportFilenames(): Promise<string[]> {
  const reportDir = getReportDir();

  let files: string[];
  try {
    files = await readdir(reportDir);
  } catch {
    return [];
  }

  const mdFiles = files.filter((f) => f.endsWith('.md'));

  // Sort by parsed timestamp from filename (most recent first)
  return mdFiles.sort((a, b) => {
    const dateA = parseReportTimestamp(a);
    const dateB = parseReportTimestamp(b);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB.getTime() - dateA.getTime();
  });
}
