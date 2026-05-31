'use client';

import { interpretError } from '@/lib/errorMessage';

type Props = {
  error: unknown;
  /**
   * When true (default) we render nothing for wallet-rejection errors.
   * Set false to keep showing "Cancelled" feedback for them.
   */
  silentOnRejection?: boolean;
  className?: string;
};

export function ErrorBanner({ error, silentOnRejection = true, className }: Props) {
  const friendly = interpretError(error);
  if (!friendly) return null;
  if (friendly.kind === 'user-rejected' && silentOnRejection) return null;

  return (
    <div
      className={`rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 flex flex-col gap-1 ${
        className ?? ''
      }`}
    >
      <p className="text-sm font-medium text-red-700 dark:text-red-200">{friendly.title}</p>
      <p className="text-xs text-red-700/80 dark:text-red-200/80 break-words">
        {friendly.message}
      </p>
      {friendly.action && (
        <a
          href={friendly.action.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-red-700 dark:text-red-200 underline self-start mt-1"
        >
          {friendly.action.label} →
        </a>
      )}
    </div>
  );
}
