import {DefaultAzureCredential} from '@azure/identity';
import type {AccessToken} from '@azure/identity';

const ADO_SCOPE = '499b84ac-1321-427f-aa17-267ca6975798/.default';

/**
 * Get an access token for Azure DevOps using DefaultAzureCredential.
 *
 * DefaultAzureCredential tries multiple authentication methods in order:
 * 1. Environment variables (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
 * 2. Managed Identity (for Azure VMs/containers)
 * 3. Azure CLI (if logged in via `az login`)
 * 4. Visual Studio Code Azure extension
 * 5. Interactive browser (fallback)
 *
 * @returns Access token object with token string and expiration timestamps
 * @throws Error if no credential method succeeds
 */
export async function getAdoAccessToken(): Promise<AccessToken> {
  console.log('\nAzure DevOps authentication required.');
  console.log('Attempting to acquire token via DefaultAzureCredential...');

  const credential = new DefaultAzureCredential();
  const token = await credential.getToken(ADO_SCOPE);
  if (!token) {
    throw new Error('Failed to acquire Azure DevOps token');
  }

  console.log('✓ Authenticated successfully\n');
  return token;
}
