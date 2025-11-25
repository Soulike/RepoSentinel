import 'dotenv/config';
import {runAgent} from './agent.js';
import {logger} from './logger/logger.js';

runAgent().catch((error) => {
  logger.error('Agent failed', error);
  process.exit(1);
});
