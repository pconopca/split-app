import { NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/baseUrl';

export const dynamic = 'force-static';

export function GET() {
  const baseUrl = getBaseUrl();

  return NextResponse.json({
    miniapp: {
      version: '1',
      name: 'Split',
      iconUrl: `${baseUrl}/icon.png`,
      homeUrl: baseUrl,
      splashImageUrl: `${baseUrl}/splash.png`,
      splashBackgroundColor: '#0052ff',
      subtitle: 'Split bills in USDC',
      description: 'Split bills with friends in USDC, right inside the Base App.',
      primaryCategory: 'finance',
      tags: ['payments', 'usdc', 'social', 'splitwise'],
      heroImageUrl: `${baseUrl}/hero.png`,
      tagline: 'Pay your share in 2 taps',
      ogTitle: 'Split — pay your share in USDC',
      ogDescription: 'Split bills with friends in USDC, right inside the Base App.',
      ogImageUrl: `${baseUrl}/hero.png`,
    },
    // accountAssociation is required for production publishing; generated via
    // Base App / Farcaster developer tools and signed by the owning account.
    // Leave empty during development.
  });
}
