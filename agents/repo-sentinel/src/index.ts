import {runAgent} from './agent.js';
import {getCheckIntervalHours} from './helpers/env-helpers.js';
import {logger} from '@helpers/logger';

const runWithErrorHandling = async (): Promise<void> => {
  try {
    await runAgent(logger);
  } catch (error) {
    logger.error('Agent failed', error);
  }
  const nextRun = new Date(
    Date.now() + getCheckIntervalHours() * 60 * 60 * 1000,
  );
  logger.info(`Run complete. Next run at ${nextRun.toLocaleString()}`);
};

const startScheduler = (): void => {
  const intervalHours = getCheckIntervalHours();
  const intervalMs = intervalHours * 60 * 60 * 1000;

  logger.info(`Scheduler started. Running every ${intervalHours} hour(s).`);

  // Run immediately on startup
  runWithErrorHandling();

  // Schedule subsequent runs
  setInterval(() => {
    runWithErrorHandling();
  }, intervalMs);
};

startScheduler();
