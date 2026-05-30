'use client';

import { useEffect, useState } from 'react';

type Props = {
  url: string;
  title?: string;
  text?: string;
  className?: string;
  variant?: 'primary' | 'secondary';
};

export function ShareButton({ url, title, text, className, variant = 'primary' }: Props) {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  async function handleClick() {
    const payload = { title: title ?? 'Split', text: text ?? '', url };
    try {
      if (canShare && navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch (err) {
      // User cancelled or share failed — fall through to copy.
      if ((err as Error)?.name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(text ? `${text}\n${url}` : url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Last resort: prompt the user with the link.
      window.prompt('Copy this link:', url);
    }
  }

  const base =
    'w-full py-4 rounded-xl font-semibold text-center transition-colors shadow-lg disabled:shadow-none flex items-center justify-center gap-2';
  const styles =
    variant === 'primary'
      ? 'bg-[#0052ff] hover:bg-[#0040cc] text-white shadow-[#0052ff]/20'
      : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white shadow-none';

  return (
    <button type="button" onClick={handleClick} className={`${base} ${styles} ${className ?? ''}`}>
      {copied ? (
        <>
          <CheckIcon /> Copied!
        </>
      ) : canShare ? (
        <>
          <ShareIcon /> Share with friends
        </>
      ) : (
        <>
          <LinkIcon /> Copy link
        </>
      )}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
