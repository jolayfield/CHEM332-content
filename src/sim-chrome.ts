/**
 * Shared behaviour for the nav bar on every simulation page:
 * records the visit for the home page's "Continue" card and turns the ☆
 * button into a "mark as done" toggle.
 */
import { findSimByPath } from './chapters';
import { loadProgress, recordVisit, toggleDone } from './progress';

function renderBookmark(btn: HTMLButtonElement, done: boolean): void {
  btn.textContent = done ? '★' : '☆';
  btn.setAttribute('aria-pressed', String(done));
  const label = done ? 'Marked as done. Click to unmark' : 'Mark this simulation as done';
  btn.setAttribute('aria-label', label);
  btn.title = label;
  btn.classList.toggle('is-done', done);
}

const sim = findSimByPath(location.pathname);
const bookmark = document.querySelector<HTMLButtonElement>('.nav-bookmark');

if (sim) {
  recordVisit(sim.id);
  if (bookmark) {
    renderBookmark(bookmark, !!loadProgress().done[sim.id]);
    bookmark.addEventListener('click', () => renderBookmark(bookmark, toggleDone(sim.id)));
  }
} else if (bookmark) {
  // Pages outside the course list (e.g. drafts) have nothing to track
  bookmark.hidden = true;
}
