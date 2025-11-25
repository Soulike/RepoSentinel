import {exec} from 'child_process';
import {promisify} from 'util';
import {getRepoPath} from './env-helpers.js';

const execAsync = promisify(exec);

export async function execGit(args: string[]): Promise<string> {
  const repoPath = getRepoPath();
  const command = `git -C "${repoPath}" ${args.join(' ')}`;

  const {stdout} = await execAsync(command, {
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large diffs
  });

  return stdout.trim();
}
