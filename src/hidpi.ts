/**
 * Crisp canvas rendering on high-density (Retina / phone) screens.
 *
 * The backing store is sized at CSS size × devicePixelRatio and the context is
 * pre-scaled, so drawing code keeps working in CSS pixels.
 */

/**
 * Size a canvas to its layout box at device resolution. Width comes from the
 * canvas's own CSS width; height from its parent's content box (or the fallback).
 * Returns the size in CSS pixels. Call again on resize.
 */
export function fitCanvasToParent(canvas: HTMLCanvasElement, fallbackHeight = 0): { width: number; height: number } {
  const dpr = window.devicePixelRatio || 1;
  const parent = canvas.parentElement;
  const width = Math.round(canvas.getBoundingClientRect().width) || parent?.clientWidth || 300;

  // Set the backing width before measuring the parent: with the old bitmap's
  // aspect ratio gone, an auto-height canvas falls back to its CSS min-height,
  // so the parent reflects the layout rather than the previous bitmap size.
  canvas.width = Math.round(width * dpr);
  canvas.style.height = '';

  let height = fallbackHeight;
  if (parent) {
    const cs = getComputedStyle(parent);
    // Content box only: including padding would grow the canvas on every resize
    const contentHeight = parent.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    height = Math.round(contentHeight) || fallbackHeight;
  }

  fitCanvas(canvas, width, height);
  return { width, height };
}

/**
 * Give a canvas a CSS size of width × height at device resolution. Its width
 * should already come from CSS (e.g. width: 100%); the height is set here.
 */
export function fitCanvas(canvas: HTMLCanvasElement, width: number, height: number): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.height = `${height}px`;
  canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/**
 * Offscreen canvas at device resolution with a pre-scaled context. Draw it back
 * with ctx.drawImage(canvas, 0, 0, width, height) so it maps 1:1 to device pixels.
 */
export function createHiDPIOffscreen(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { canvas, ctx };
}
