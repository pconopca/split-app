'use client';

import { useSyncExternalStore, useCallback } from 'react';

export type Friend = {
  nick: string;
  address: `0x${string}`;
  createdAt: number;
};

const STORAGE_KEY = 'split.friends.v1';

function read(): Friend[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(friends: Friend[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(friends));
  window.dispatchEvent(new Event('split:friends-changed'));
}

const subscribers = new Set<() => void>();
function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener('split:friends-changed', handler);
  window.addEventListener('storage', handler);
  subscribers.add(cb);
  return () => {
    window.removeEventListener('split:friends-changed', handler);
    window.removeEventListener('storage', handler);
    subscribers.delete(cb);
  };
}

function getSnapshot(): Friend[] {
  return read();
}

let cached: Friend[] | null = null;
let cachedJson = '';
function getStableSnapshot(): Friend[] {
  const next = read();
  const json = JSON.stringify(next);
  if (json === cachedJson && cached) return cached;
  cachedJson = json;
  cached = next;
  return cached;
}

const EMPTY: readonly Friend[] = Object.freeze([]);

export function useFriends() {
  const friends = useSyncExternalStore(
    subscribe,
    getStableSnapshot,
    () => EMPTY as Friend[],
  );

  const add = useCallback((nick: string, address: `0x${string}`) => {
    const list = read();
    const lower = address.toLowerCase();
    const existing = list.findIndex((f) => f.address.toLowerCase() === lower);
    const entry: Friend = { nick: nick.trim() || shortAddress(address), address, createdAt: Date.now() };
    if (existing >= 0) {
      list[existing] = { ...list[existing], nick: entry.nick };
    } else {
      list.unshift(entry);
    }
    write(list);
  }, []);

  const remove = useCallback((address: `0x${string}`) => {
    const lower = address.toLowerCase();
    write(read().filter((f) => f.address.toLowerCase() !== lower));
  }, []);

  const findByAddress = useCallback(
    (address: `0x${string}`) =>
      friends.find((f) => f.address.toLowerCase() === address.toLowerCase()) ?? null,
    [friends],
  );

  return { friends, add, remove, findByAddress };
}

export function shortAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

void getSnapshot;
