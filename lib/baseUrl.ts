/**
 * Public base URL of the app. Required for fc:miniapp embed metadata
 * (cast embeds must use absolute URLs).
 *
 * Set NEXT_PUBLIC_APP_URL in your Vercel env vars (and locally in .env.local
 * with e.g. http://localhost:3000) so that share previews resolve correctly.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
