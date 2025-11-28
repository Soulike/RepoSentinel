import * as azdev from 'azure-devops-node-api';
import type {IGitApi} from 'azure-devops-node-api/GitApi.js';
import {VersionControlChangeType} from 'azure-devops-node-api/interfaces/GitInterfaces.js';

/**
 * Common parameters for all Azure DevOps tools.
 */
export interface AdoBaseParams {
  /** Azure DevOps organization name */
  organization: string;
  /** Azure DevOps project name */
  project: string;
  /** Repository name or ID */
  repository: string;
  /** Bearer token for authentication */
  token: string;
}

/**
 * Create a GitApi client for Azure DevOps.
 *
 * @param organization - Azure DevOps organization name
 * @param token - Bearer token for authentication
 * @returns GitApi client
 */
export async function createGitClient(
  organization: string,
  token: string,
): Promise<IGitApi> {
  const orgUrl = `https://dev.azure.com/${organization}`;
  const authHandler = azdev.getBearerHandler(token);
  const connection = new azdev.WebApi(orgUrl, authHandler);
  return connection.getGitApi();
}

/**
 * Map VersionControlChangeType to readable string.
 *
 * @see https://learn.microsoft.com/en-us/rest/api/azure/devops/git/commits/get?view=azure-devops-rest-7.0#versioncontrolchangetype
 */
export function changeTypeToString(
  changeType: VersionControlChangeType,
): string {
  const types: Record<number, string> = {
    [VersionControlChangeType.Add]: 'add',
    [VersionControlChangeType.Edit]: 'edit',
    [VersionControlChangeType.Encoding]: 'encoding',
    [VersionControlChangeType.Rename]: 'rename',
    [VersionControlChangeType.Delete]: 'delete',
    [VersionControlChangeType.Undelete]: 'undelete',
    [VersionControlChangeType.Branch]: 'branch',
    [VersionControlChangeType.Merge]: 'merge',
    [VersionControlChangeType.Lock]: 'lock',
    [VersionControlChangeType.Rollback]: 'rollback',
    [VersionControlChangeType.SourceRename]: 'sourceRename',
    [VersionControlChangeType.TargetRename]: 'targetRename',
    [VersionControlChangeType.Property]: 'property',
  };
  return types[changeType] ?? `unknown(${changeType})`;
}
