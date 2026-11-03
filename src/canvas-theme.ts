/**
 * Shared text styling for canvas drawings, matched to the page typography
 * (Lato for labels, Lora for display text). Every color here meets WCAG AA
 * (≥ 4.5:1) on the canvas background it is meant for.
 */

/** Canvas font string, e.g. canvasFont(12, 600) → "600 12px 'Lato', sans-serif". */
export function canvasFont(px: number, weight: number | 'normal' | 'bold' = 'normal', family: 'Lato' | 'Lora' = 'Lato'): string {
  const fallback = family === 'Lora' ? 'Georgia, serif' : 'sans-serif';
  return `${weight} ${px}px '${family}', ${fallback}`;
}

/** Text on the light paper background (#f4f1ec). Ratios in comments. */
export const INK_ON_PAPER = {
  primary: '#1a1520',    // 15.9:1, --ink
  secondary: '#4b4554',  // 8.2:1, --ink-2: axis labels, tick values
  accent: '#5b2a84',     // 8.8:1, --accent-2
  orange: '#c2410c',     // 4.6:1
  blue: '#2f45d8',       // 6.3:1
  red: '#c62828',        // 5.0:1
  green: '#2e7d32',      // 4.6:1
};

/** Text on the dark simulation background (#0a0612). Ratios in comments. */
export const INK_ON_DARK = {
  primary: 'rgba(255,255,255,0.92)',
  secondary: 'rgba(255,255,255,0.72)', // 10.3:1: axis labels, tick values
  muted: 'rgba(255,255,255,0.6)',      // 7.3:1: region labels, captions
  blue: '#8c9eff',                     // 8.1:1
};
