'use client';

import { useEffect, useState } from 'react';

type Props = {
  url: string;
  title?: string;
  text?: string;
  className?: string;
  variant?: 'primary' | 'secondary';
};

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fallthrough to legacy */
    }
  }
  // Legacy fallback (works without secure context on older browsers).
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function ShareButton({ url, title, text, className, variant = 'primary' }: Props) {
  const [mobile, setMobile] = useState(false);
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    setMobile(isMobile());
  }, []);

  async function handleClick() {
    const fullText = text ? `${text}\n${url}` : url;

    // Always copy to clipboard so the user has the link as a guaranteed result.
    const copied = await copyToClipboard(fullText);

    // On mobile, also offer the native share sheet (don't await failure).
    if (mobile && typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: title ?? 'Split', text: text ?? '', url }).catch(() => {
        /* user dismissed or share unsupported — clipboard already copied */
      });
    }

    setStatus(copied ? 'copied' : 'failed');
    setTimeout(() => setStatus('idle'), 1800);

    if (!copied) {
      // Worst case: surface the URL in a prompt so user can copy manually.
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
      {status === 'copied' ? (
        <>
          <CheckIcon /> Link copied!
        </>
      ) : status === 'failed' ? (
        <>
          <LinkIcon /> Copy failed
        </>
      ) : mobile ? (
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
