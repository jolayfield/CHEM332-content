import './style.css';
import { initializeCapacitor } from './src/app-init';
import { initializeAppLifecycle } from './src/app-lifecycle';
import { initializeStorage } from './src/storage-manager';
import { initializeTheme } from './src/theme-manager';

console.log('QuantumChem Landing Page Loaded');

// ─── Data model ──────────────────────────────────────────────────────────────

interface SimEntry {
  id: string;
  title: string;
  section: string;
  href: string;
  done: boolean;
}

interface Chapter {
  num: string;
  title: string;
  weeks: string;
  sims: SimEntry[];
}

interface Progress {
  lastSim: string;
  bookmark: string;
  step: number;
  total: number;
  section: string;
  title: string;
  done: Record<string, boolean>;
}

const STORAGE_KEY = 'qc.progress';

const DEFAULT_PROGRESS: Progress = {
  lastSim: 'photoelectric',
  bookmark: 'Introduction',
  step: 0,
  total: 12,
  section: '1.1',
  title: 'The Photoelectric Effect',
  done: {},
};

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_PROGRESS };
}

// ─── Chapter / sim definitions ────────────────────────────────────────────────

function buildChapters(progress: Progress): Chapter[] {
  const done = progress.done ?? {};
  return [
    {
      num: '01',
      title: 'Failure of Classical Mechanics',
      weeks: 'Weeks 1–2',
      sims: [
        { id: 'photoelectric', title: 'Photoelectric Effect',   section: '1.1', href: 'photoelectric.html', done: !!done['photoelectric'] },
        { id: 'blackbody',     title: 'Black Body Radiation',   section: '1.2', href: 'blackbody.html',     done: !!done['blackbody']     },
      ],
    },
    {
      num: '02',
      title: 'Idealized Quantum Systems',
      weeks: 'Weeks 3–4',
      sims: [
        { id: 'particlebox',   title: 'Particle in a Box (1D)', section: '2.1', href: 'particlebox.html',   done: !!done['particlebox']   },
        { id: 'particlebox2d', title: 'Particle in a Box (2D)', section: '2.2', href: 'particlebox2d.html', done: !!done['particlebox2d'] },
        { id: 'tunneling',     title: 'Quantum Tunneling',      section: '2.3', href: 'barrier.html',       done: !!done['tunneling']     },
      ],
    },
    {
      num: '03',
      title: 'Molecular Spectroscopy',
      weeks: 'Weeks 5–6',
      sims: [
        { id: 'ir-spectra',    title: 'IR Vibrational Spectra',        section: '3.1', href: 'ir-spectra.html',    done: !!done['ir-spectra']    },
        { id: 'rot-spectra',   title: 'Rotational Spectra',            section: '3.2', href: 'rot-spectra.html',   done: !!done['rot-spectra']   },
        { id: 'vibrot-spectra',title: 'Vibrational-Rotational Spectra',section: '3.3', href: 'vibrot-spectra.html',done: !!done['vibrot-spectra'] },
      ],
    },
    {
      num: '04',
      title: 'Atomic Systems',
      weeks: 'Weeks 7–8',
      sims: [
        { id: 'bohr',          title: 'Bohr Model',         section: '4.1', href: 'bohr.html',           done: !!done['bohr']          },
        { id: 'orbitals',      title: 'Atomic Orbitals',    section: '4.2', href: 'atomic-orbitals.html', done: !!done['orbitals']      },
        { id: 'hybridization', title: 'Orbital Hybridization', section: '4.3', href: 'hybridization.html', done: !!done['hybridization'] },
      ],
    },
    {
      num: '05',
      title: 'Molecular Systems',
      weeks: 'Weeks 9–10',
      sims: [
        { id: 'mo-schemes', title: 'Diatomic MO Schemes', section: '5.1', href: 'mo-scheme.html', done: !!done['mo-schemes'] },
      ],
    },
  ];
}

// ─── Render helpers ───────────────────────────────────────────────────────────

function renderResume(p: Progress): string {
  const pct = p.total > 0 ? Math.round((p.step / p.total) * 100) : 0;
  const ticks = Array.from({ length: p.total }, (_, i) =>
    `<div class="tick${i < p.step ? ' done' : ''}"></div>`
  ).join('');
  return `
    <div class="resume-inner">
      <div class="eyebrow">Continue reading</div>
      <div class="resume-title">§ ${p.section} · ${p.title}</div>
      <div class="resume-sub">You stopped on &ldquo;${p.bookmark}.&rdquo;</div>
      <div class="qc-prog">${ticks}</div>
      <div class="byline" style="margin-top:8px">${p.step} / ${p.total} &nbsp;·&nbsp; ${pct}% complete</div>
    </div>`;
}

function renderProgressStrip(chapters: Chapter[]): string {
  return chapters.map(c => {
    const doneCount = c.sims.filter(s => s.done).length;
    const pct = c.sims.length > 0 ? (doneCount / c.sims.length) * 100 : 0;
    return `<div class="cp-seg" style="flex:${c.sims.length}">
      <div class="cp-fill" style="width:${pct}%"></div>
    </div>`;
  }).join('');
}

function renderTOC(chapters: Chapter[]): string {
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
          <div class="meta byline">${c.weeks} &nbsp;·&nbsp; ${doneCount}/${c.sims.length} done</div>
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
