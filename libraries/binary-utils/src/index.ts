/**
 * Check if a string contains binary content by looking for null bytes.
 * Null bytes are extremely rare in text files but common in binary files.
 *
 * @param content - The string content to check
 * @param checkLength - Number of characters to check (default: 1000)
 * @returns true if the content appears to be binary
 */
export function isBinary(content: string, checkLength = 1000): boolean {
  const sample = content.slice(0, checkLength);
  return sample.includes('\x00');
}

/**
 * Check if base64-encoded content represents a binary file.
 * Decodes the base64 string as UTF-8 and checks for null bytes.
 *
 * @param base64Content - Base64-encoded file content
 * @param checkLength - Number of bytes to check (default: 1000)
 * @returns true if the content appears to be binary
 */
export function isBinaryBase64(
  base64Content: string,
  checkLength = 1000,
): boolean {
  const buffer = Buffer.from(base64Content, 'base64');
  const sample = buffer.subarray(0, checkLength).toString('utf-8');
  return sample.includes('\x00');
}
