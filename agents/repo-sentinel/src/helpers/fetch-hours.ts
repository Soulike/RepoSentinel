import {getReportFilenames, parseReportTimestamp} from './report-utils.js';

/**
 * Calculate how many hours back to fetch commits.
 * Based on latest report timestamp, capped at maxFetchHours.
 */
export async function calculateFetchHours(
  maxFetchHours: number,
): Promise<number> {
  const now = new Date();

  const reports = await getReportFilenames();

  if (reports.length > 0) {
    // Try to parse timestamp from the most recent report filename
    for (const filename of reports) {
      const timestamp = parseReportTimestamp(filename);
      if (timestamp) {
        const hoursSinceLastReport =
          (now.getTime() - timestamp.getTime()) / (60 * 60 * 1000);
        if (hoursSinceLastReport <= 0) {
          throw new Error(
            `Report timestamp ${timestamp.toISOString()} is in the future or now`,
          );
        }
        // Cap at maxFetchHours
        return Math.min(Math.ceil(hoursSinceLastReport), maxFetchHours);
      }
    }
  }

  // No reports or no valid timestamps found, use maxFetchHours
  return maxFetchHours;
}
