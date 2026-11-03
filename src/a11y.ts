/**
 * Shared accessibility behavior for every page: the skip link, one persistent
 * live region for announcements, chip-group radio semantics, and the
 * instructor review view. See docs/plans/2026-11-03-1016-feat-screen-reader-keyboard-access-plan.md.
 */

const LIVE_REGION_ID = 'a11y-announcer';
const ANNOUNCE_DELAY_MS = 750;

let announceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingText = '';

/** Inject the skip link and make sure the page has a <main id="main"> target. */
export function setupSkipLink(): void {
  if (document.querySelector('.skip-link')) return;

  let main = document.getElementById('main');
  if (!main) {
    // Wrap everything after the first top-level nav/header in <main>
    main = document.createElement('main');
    main.id = 'main';
    const first = document.querySelector('nav, .breadcrumb, header, .page-header');
    const anchor = first ?? document.body.firstElementChild;
    if (anchor && anchor.parentElement) {
      anchor.parentElement.insertBefore(main, anchor);
      let node: Element | null = anchor;
      while (node) {
        const next: Element | null = node.nextElementSibling;
        if (node.tagName !== 'SCRIPT' && node !== main) main.appendChild(node);
        node = next;
      }
    }
  }

  const link = document.createElement('a');
  link.className = 'skip-link';
  link.href = '#main';
  link.textContent = 'Skip to main content';
  document.body.insertBefore(link, document.body.firstChild);
}

/** The single persistent live region. Always in the DOM; never display:none. */
function liveRegion(): HTMLElement {
  let el = document.getElementById(LIVE_REGION_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = LIVE_REGION_ID;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.className = 'sr-only';
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Queue a message. Calls within ANNOUNCE_DELAY_MS of each other collapse into
 * the latest text, so one settled change produces one announcement.
 */
export function announce(text: string): void {
  pendingText = text;
  if (announceTimer) clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    liveRegion().textContent = pendingText;
    announceTimer = null;
  }, ANNOUNCE_DELAY_MS);
}

/**
 * Give a chip group radio semantics: exactly one option is selected, and the
 * group is announced with its visible legend. Each chip is an <input type="radio">
 * inside the group; `onChange` receives the selected value.
 */
export function setupChipGroup(
  group: HTMLElement,
  onChange: (value: string) => void,
): void {
  group.setAttribute('role', 'radiogroup');
  group.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach(input => {
    input.addEventListener('change', () => {
      if (input.checked) onChange(input.value);
    });
  });
}

/** True when the page was opened with ?review=1 (instructor review view). */
export function isReviewView(): boolean {
  return new URLSearchParams(window.location.search).get('review') === '1';
}

/** Make every screen-reader-only description visible for instructor review. */
export function applyReviewView(): void {
  if (!isReviewView()) return;
  document.body.classList.add('review-view');
}
