import {execFile} from 'child_process';
import {promisify} from 'util';

const execFileAsync = promisify(execFile);

/**
 * Execute a git command in the specified repository.
 *
 * @param repoPath - Absolute path to the git repository
 * @param args - Git command arguments
 * @returns Command output as trimmed string
 */
export async function execGit(
  repoPath: string,
  args: string[],
): Promise<string> {
  const {stdout} = await execFileAsync('git', ['-C', repoPath, ...args], {
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large diffs
  });

  return stdout.trim();
}
