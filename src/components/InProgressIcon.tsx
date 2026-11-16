/**
 * "In progress" status icon: a half-filled circle that slowly rotates.
 * Reads by shape and motion rather than colour, so it stays distinct from
 * project colours and theme accents (e.g. amber Орлі, the Claude clay accent).
 * Sequence across the app: ○ todo → ◐ in progress → ✓ done.
 */
export function InProgressIcon({ className = '', title = 'В процесі' }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`ip-spin shrink-0 ${className}`} role="img" aria-label={title}>
      <title>{title}</title>
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 3.5 A4.5 4.5 0 0 1 8 12.5 Z" fill="currentColor" />
    </svg>
  );
}
