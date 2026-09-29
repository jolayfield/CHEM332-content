import './style.css';
import { initializeCapacitor } from './src/app-init';
import { initializeAppLifecycle } from './src/app-lifecycle';
import { initializeStorage } from './src/storage-manager';
import { initializeTheme } from './src/theme-manager';
import { CHAPTERS, ALL_SIMS, chapterWeeks, type Chapter, type SimEntry } from './src/chapters';
import { loadProgress, type Progress } from './src/progress';

console.log('QuantumChem Landing Page Loaded');

// ─── Data model ──────────────────────────────────────────────────────────────

interface ChapterView extends Chapter {
  sims: (SimEntry & { done: boolean })[];
}

function buildChapters(progress: Progress): ChapterView[] {
  return CHAPTERS.map(c => ({
    ...c,
    sims: c.sims.map(s => ({ ...s, done: !!progress.done[s.id] })),
  }));
}

// ─── Render helpers ───────────────────────────────────────────────────────────

function renderResume(p: Progress): string {
  const total = ALL_SIMS.length;
  const doneCount = ALL_SIMS.filter(s => p.done[s.id]).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const ticks = ALL_SIMS.map(s =>
    `<div class="tick${p.done[s.id] ? ' done' : ''}"></div>`
  ).join('');
  const last = ALL_SIMS.find(s => s.id === p.lastSim);
  const target = last ?? ALL_SIMS[0];
  const heading = last ? 'Continue where you left off' : 'Start here';
  const sub = last
    ? 'Mark a simulation done with the ☆ in its top bar to track your progress.'
    : 'Begin with the experiments that broke classical physics.';
  return `
    <a class="resume-inner" href="${target.href}" style="display:block;color:inherit;text-decoration:none">
      <div class="eyebrow">${heading}</div>
      <div class="resume-title">§ ${target.section} · ${target.title}</div>
      <div class="resume-sub">${sub}</div>
      <div class="qc-prog">${ticks}</div>
      <div class="byline" style="margin-top:8px">${doneCount} / ${total} done &nbsp;·&nbsp; ${pct}% complete</div>
    </a>`;
}

function renderProgressStrip(chapters: ChapterView[]): string {
  return chapters.map(c => {
    const doneCount = c.sims.filter(s => s.done).length;
    const pct = c.sims.length > 0 ? (doneCount / c.sims.length) * 100 : 0;
    return `<div class="cp-seg" style="flex:${c.sims.length}">
      <div class="cp-fill" style="width:${pct}%"></div>
    </div>`;
  }).join('');
}

function renderTOC(chapters: ChapterView[]): string {
  return chapters.map(c => {
    const doneCount = c.sims.filter(s => s.done).length;
    const ticks = c.sims.map(s =>
      `<div class="tick${s.done ? ' done' : ''}"></div>`
    ).join('');
    return `
      <a class="toc-row" href="simulations.html#ch-${c.num}">
        <span class="num">${c.num}</span>
        <div class="body">
          <div class="title">${c.title}</div>
          <div class="meta byline">${chapterWeeks(c)} &nbsp;·&nbsp; ${doneCount}/${c.sims.length} done</div>
          <div class="qc-prog micro meta">${ticks}</div>
        </div>
        <span class="chev">›</span>
      </a>`;
  }).join('');
}

// ─── App init ─────────────────────────────────────────────────────────────────

async function initializeApp(): Promise<void> {
  try { await initializeCapacitor(); } catch { /* web fallback */ }
  try { initializeAppLifecycle(); } catch { /* web fallback */ }
  try { await initializeStorage(); } catch { /* web fallback */ }
}

initializeApp();

document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();

  const progress = loadProgress();
  const chapters = buildChapters(progress);

  const resumeEl = document.getElementById('resume-card');
  if (resumeEl) resumeEl.innerHTML = renderResume(progress);

  const progressEl = document.getElementById('course-progress');
  if (progressEl) progressEl.innerHTML = renderProgressStrip(chapters);

  const tocEl = document.getElementById('toc');
  if (tocEl) tocEl.innerHTML = renderTOC(chapters);
});
