/**
 * Single source of truth for the course's chapter / simulation list.
 * Used by the home page, the simulations index, and per-page progress tracking.
 */
import { LECTURES, type Lecture, type LectureId } from './lectures';

export interface SimEntry {
  id: string;
  title: string;
  section: string;
  href: string;
  lectures: LectureId[]; // related lecture notes, most relevant first
}

export interface Chapter {
  num: string;
  title: string;
  sims: SimEntry[];
}

export const CHAPTERS: Chapter[] = [
  {
    num: '01',
    title: 'Failure of Classical Mechanics',
    sims: [
      { id: 'blackbody',     title: 'Black Body Radiation',   section: '1.1', href: 'blackbody.html',     lectures: [1] },
      { id: 'photoelectric', title: 'Photoelectric Effect',   section: '1.2', href: 'photoelectric.html', lectures: [2] },
    ],
  },
  {
    num: '02',
    title: 'Idealized Quantum Systems',
    sims: [
      { id: 'particlebox',   title: 'Particle in a Box (1D)', section: '2.1', href: 'particlebox.html',   lectures: [6, 9, 13] },
      { id: 'particlebox2d', title: 'Particle in a Box (2D)', section: '2.2', href: 'particlebox2d.html', lectures: [11] },
      { id: 'tunneling',     title: 'Quantum Tunneling',      section: '2.3', href: 'barrier.html',       lectures: [12] },
    ],
  },
  {
    num: '03',
    title: 'Molecular Spectroscopy',
    sims: [
      { id: 'ir-spectra',     title: 'IR Vibrational Spectra',         section: '3.1', href: 'ir-spectra.html',     lectures: [23, 19, 18] },
      { id: 'rot-spectra',    title: 'Rotational Spectra',             section: '3.2', href: 'rot-spectra.html',    lectures: [22, 21] },
      { id: 'vibrot-spectra', title: 'Vibrational-Rotational Spectra', section: '3.3', href: 'vibrot-spectra.html', lectures: [24] },
    ],
  },
  {
    num: '04',
    title: 'Atomic Systems',
    sims: [
      { id: 'bohr',          title: 'Bohr Model',            section: '4.1', href: 'bohr.html',            lectures: [27] },
      { id: 'orbitals',      title: 'Atomic Orbitals',       section: '4.2', href: 'atomic-orbitals.html', lectures: [26, 25] },
      { id: 'hybridization', title: 'Orbital Hybridization', section: '4.3', href: 'hybridization.html',   lectures: [36] },
    ],
  },
  {
    num: '05',
    title: 'Molecular Systems',
    sims: [
      { id: 'mo-schemes', title: 'Diatomic MO Schemes', section: '5.1', href: 'mo-scheme.html', lectures: [35, 34, '34s', 36] },
    ],
  },
];

export const ALL_SIMS: SimEntry[] = CHAPTERS.flatMap(c => c.sims);

export function lecturesFor(sim: SimEntry): Lecture[] {
  return sim.lectures.map(id => LECTURES[id]);
}

/**
 * Weeks covered by a chapter's related lectures, e.g. "Week 1", "Weeks 2–5",
 * "Weeks 9, 12". Derived from the lecture list so it can't drift from the schedule.
 */
export function chapterWeeks(chapter: Chapter): string {
  const weeks = [...new Set(chapter.sims.flatMap(s => lecturesFor(s).map(l => l.week)))].sort((a, b) => a - b);
  if (weeks.length === 0) return '';
  const runs: string[] = [];
  let start = weeks[0];
  let prev = weeks[0];
  for (const w of [...weeks.slice(1), Infinity]) {
    if (w === prev + 1) { prev = w; continue; }
    runs.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = prev = w;
  }
  return `${weeks.length > 1 ? 'Weeks' : 'Week'} ${runs.join(', ')}`;
}

/** Find the simulation whose page is the given path (e.g. location.pathname). */
export function findSimByPath(pathname: string): SimEntry | undefined {
  const file = pathname.split('/').pop() || '';
  return ALL_SIMS.find(s => s.href === file);
}
