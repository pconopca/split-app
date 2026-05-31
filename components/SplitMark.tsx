/**
 * The Split brand mark — a white "Y" (one trunk → two branches) on the
 * Base blue rounded square. Same geometry is duplicated inside the
 * ImageResponse routes for /icon.png, /splash.png, /hero.png so they
 * stay visually identical without coupling React + edge runtimes.
 */

type Props = {
  size?: number;
  className?: string;
};

export function SplitMark({ size = 32, className }: Props) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        background: '#0052ff',
        borderRadius: Math.round(size * 0.22),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      aria-label="Split"
    >
      <svg
        width={Math.round(size * 0.7)}
        height={Math.round(size * 0.7)}
        viewBox="0 0 200 200"
        fill="none"
        stroke="white"
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="100" y1="38" x2="100" y2="100" />
        <line x1="100" y1="100" x2="30" y2="170" />
        <line x1="100" y1="100" x2="170" y2="170" />
      </svg>
    </div>
  );
}
