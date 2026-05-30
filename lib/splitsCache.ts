'use client';

/**
 * Persists per-user split discovery in localStorage so repeat visits
 * to /splits don't re-scan the full chain every time.
 *
 * What we cache:
 *  - lastScannedBlock — high-water mark for getLogs (delta scan)
 *  - candidates — splits where the user is creator OR participant,
 *    deduplicated by id. The per-split *state* (paidCount, hasPaidByUser)
 *    is NEVER cached — always re-fetched.
 *
 * Versioned key so we can break the shape later without surprises.
 */

const VERSION = 1;

export type CachedCandidate = {
  splitId: string; // bigint as decimal string
  creator: `0x${string}`;
  amountPerPerson: string;
  participants: `0x${string}`[];
  memo: string;
  createdBlock: string;
};

export type SplitsCache = {
  lastScannedBlock: string;
  candidates: CachedCandidate[];
};

function keyFor(chainId: number, userAddress: `0x${string}`): string {
  return `split.splits.v${VERSION}.${chainId}.${userAddress.toLowerCase()}`;
}

export function readCache(
  chainId: number,
  userAddress: `0x${string}`,
): SplitsCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(keyFor(chainId, userAddress));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SplitsCache;
    if (typeof parsed.lastScannedBlock !== 'string') return null;
    if (!Array.isArray(parsed.candidates)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCache(
  chainId: number,
  userAddress: `0x${string}`,
  cache: SplitsCache,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(keyFor(chainId, userAddress), JSON.stringify(cache));
  } catch {
    /* quota exceeded or storage disabled — ignore */
  }
}

export function clearCache(chainId: number, userAddress: `0x${string}`): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(keyFor(chainId, userAddress));
  } catch {
    /* ignore */
  }
}

export function mergeCandidates(
  existing: CachedCandidate[],
  incoming: CachedCandidate[],
): CachedCandidate[] {
  const byId = new Map<string, CachedCandidate>();
  for (const c of existing) byId.set(c.splitId, c);
  for (const c of incoming) byId.set(c.splitId, c);
  return Array.from(byId.values());
}
