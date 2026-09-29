import './style.css';
import { setupMobileMenu } from './src/mobile-menu';
import { initializeTheme } from './src/theme-manager';
import { CHAPTERS, type Chapter } from './src/chapters';
import { loadProgress } from './src/progress';

function renderSimTOC(chapters: Chapter[]): string {
  const { done } = loadProgress();
  return chapters.map(c => {
    const rows = c.sims.map(s => `
      <a class="toc-row sim-row" href="${s.href}">
        <span class="num">${s.section}</span>
        <div class="body">
          <div class="title">${s.title}${done[s.id] ? ' <span class="byline" aria-label="done">✓ done</span>' : ''}</div>
        </div>
        <span class="chev">›</span>
      </a>`).join('');

    return `
      <div class="chapter-section" id="ch-${c.num}">
        <div class="chapter-section-header">
          <span class="num">${c.num}</span>
          <span class="ch-title">${c.title}</span>
        </div>
        ${rows}
      </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  setupMobileMenu();

  const tocEl = document.getElementById('sim-toc');
  if (tocEl) tocEl.innerHTML = renderSimTOC(CHAPTERS);
});
