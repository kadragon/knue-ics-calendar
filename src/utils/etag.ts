/**
 * Generates an ETag hash for HTTP caching based on content
 * @param data - The content to generate an ETag for
 * @returns Promise<string> - The ETag value in quotes
 */
export async function generateEtag(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `"${hashHex.substring(0, 16)}"`;
}