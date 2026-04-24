import './style.css';
import { setupMobileMenu } from './src/mobile-menu';
import { initializeTheme } from './src/theme-manager';

interface SimEntry {
  id: string;
  title: string;
  section: string;
  href: string;
}

interface Chapter {
  num: string;
  title: string;
  weeks: string;
  sims: SimEntry[];
}

const CHAPTERS: Chapter[] = [
  {
    num: '01',
    title: 'Failure of Classical Mechanics',
    weeks: 'Weeks 1–2',
    sims: [
      { id: 'photoelectric', title: 'Photoelectric Effect',   section: '1.1', href: 'photoelectric.html' },
      { id: 'blackbody',     title: 'Black Body Radiation',   section: '1.2', href: 'blackbody.html'     },
    ],
  },
  {
    num: '02',
    title: 'Idealized Quantum Systems',
    weeks: 'Weeks 3–4',
    sims: [
      { id: 'particlebox',   title: 'Particle in a Box (1D)', section: '2.1', href: 'particlebox.html'   },
      { id: 'particlebox2d', title: 'Particle in a Box (2D)', section: '2.2', href: 'particlebox2d.html' },
      { id: 'tunneling',     title: 'Quantum Tunneling',      section: '2.3', href: 'barrier.html'       },
    ],
  },
  {
    num: '03',
    title: 'Molecular Spectroscopy',
    weeks: 'Weeks 5–6',
    sims: [
      { id: 'ir-spectra',     title: 'IR Vibrational Spectra',         section: '3.1', href: 'ir-spectra.html'     },
      { id: 'rot-spectra',    title: 'Rotational Spectra',             section: '3.2', href: 'rot-spectra.html'    },
      { id: 'vibrot-spectra', title: 'Vibrational-Rotational Spectra', section: '3.3', href: 'vibrot-spectra.html' },
    ],
  },
  {
    num: '04',
    title: 'Atomic Systems',
    weeks: 'Weeks 7–8',
    sims: [
      { id: 'bohr',          title: 'Bohr Model',            section: '4.1', href: 'bohr.html'           },
      { id: 'orbitals',      title: 'Atomic Orbitals',       section: '4.2', href: 'atomic-orbitals.html'},
      { id: 'hybridization', title: 'Orbital Hybridization', section: '4.3', href: 'hybridization.html'  },
    ],
  },
  {
    num: '05',
    title: 'Molecular Systems',
    weeks: 'Weeks 9–10',
    sims: [
      { id: 'mo-schemes', title: 'Diatomic MO Schemes', section: '5.1', href: 'mo-scheme.html' },
    ],
  },
];

function renderSimTOC(chapters: Chapter[]): string {
  return chapters.map(c => {
    const rows = c.sims.map(s => `
      <a class="toc-row sim-row" href="${s.href}">
        <span class="num">${s.section}</span>
        <div class="body">
          <div class="title">${s.title}</div>
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
