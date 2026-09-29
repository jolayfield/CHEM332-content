/**
 * Shared behaviour for every simulation page: records the visit for the home
 * page's "Continue" card, turns the ☆ button into a "mark as done" toggle, and
 * links the related lecture notes at the bottom of the page.
 */
import { findSimByPath, lecturesFor } from './chapters';
import type { Lecture } from './lectures';
import { loadProgress, recordVisit, toggleDone } from './progress';

function renderBookmark(btn: HTMLButtonElement, done: boolean): void {
  btn.textContent = done ? '★' : '☆';
  btn.setAttribute('aria-pressed', String(done));
  const label = done ? 'Marked as done. Click to unmark' : 'Mark this simulation as done';
  btn.setAttribute('aria-label', label);
  btn.title = label;
  btn.classList.toggle('is-done', done);
}

/** Append links to the lecture-note PDFs that cover this simulation's topic. */
function renderRelatedLectures(lectures: Lecture[]): void {
  const container = document.querySelector('.sim-nav')?.parentElement;
  if (!container || lectures.length === 0) return;
  const section = document.createElement('section');
  section.className = 'related-lectures';
  section.setAttribute('aria-labelledby', 'related-lectures-heading');
  section.innerHTML = `
    <h2 class="fig-caption" id="related-lectures-heading">Related lecture notes</h2>
    ${lectures.map(l => `
      <a class="toc-row sim-row" href="${l.pdf}" target="_blank" rel="noopener">
        <span class="num">${l.label}</span>
        <div class="body">
          <div class="title">${l.title}</div>
          <div class="meta byline">Week ${l.week} &nbsp;·&nbsp; PDF</div>
        </div>
        <span class="chev" aria-hidden="true">›</span>
      </a>`).join('')}`;
  container.appendChild(section);
}

const sim = findSimByPath(location.pathname);
const bookmark = document.querySelector<HTMLButtonElement>('.nav-bookmark');

if (sim) {
  recordVisit(sim.id);
  renderRelatedLectures(lecturesFor(sim));
  if (bookmark) {
    renderBookmark(bookmark, !!loadProgress().done[sim.id]);
    bookmark.addEventListener('click', () => renderBookmark(bookmark, toggleDone(sim.id)));
  }
} else if (bookmark) {
  // Pages outside the course list (e.g. drafts) have nothing to track
  bookmark.hidden = true;
}
