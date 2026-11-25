/**
 * NEOFLAM wordmark, redrawn as a vector in the brand's squared lowercase style
 * (n · e · o · f · l · a · m built from even, heavy strokes with softly rounded corners).
 * Swap for the official SVG from the brand kit when it is supplied.
 */
export function Logo({ className = "", title = "NEOFLAM" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 320 28"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={8}
      strokeLinejoin="round"
    >
      {/* n */}
      <path d="M4 28V4H36V28" />
      {/* e */}
      <path d="M82 14V4H50V24H82M50 14H82" />
      {/* o */}
      <path d="M96 4H128V24H96Z" />
      {/* f */}
      <path d="M170 4H142V28M142 14H166" />
      {/* l */}
      <path d="M184 0V24H212" />
      {/* a */}
      <path d="M226 4H258V24H226V14H258" />
      {/* m */}
      <path d="M272 28V4H316V28M294 4V28" />
    </svg>
  );
}
