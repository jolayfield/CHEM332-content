/**
 * Lecture notes shipped in public/lectures (PDFs), keyed by lecture id.
 * Titles mirror the headings of the matching Lecture_NN.md sources.
 */

export interface Lecture {
  label: string;   // short label shown in the row, e.g. "L1"
  week: number;
  title: string;
  pdf: string;     // path relative to the site root
}

function lec(num: number, week: number, title: string): Lecture {
  const nn = String(num).padStart(2, '0');
  const ww = String(week).padStart(2, '0');
  return { label: `L${num}`, week, title, pdf: `lectures/Week_${ww}/Lecture_${nn}.pdf` };
}

export const LECTURES = {
  1:  lec(1, 1, 'Blackbody Radiation & Planck’s Quantum Hypothesis'),
  2:  lec(2, 1, 'The Photoelectric Effect & Compton Scattering'),
  6:  lec(6, 2, 'Free Particle & Particle in a 1-D Infinite Box'),
  9:  lec(9, 3, 'Postulates IV–VI: Expansion, Expectation Values & Time Evolution'),
  11: lec(11, 4, 'Particle in 2-D and 3-D Boxes — Degeneracy'),
  12: lec(12, 4, 'Finite Potential Well & Quantum Tunneling'),
  13: lec(13, 5, 'Conjugated π-Systems, Quantum Dots & Real-World PIB Applications'),
  18: lec(18, 6, 'Applications: Reducible Representations & the Reduction Formula'),
  19: lec(19, 7, 'The Quantum Harmonic Oscillator'),
  21: lec(21, 7, 'The Rigid Rotor Model'),
  22: lec(22, 8, 'Rotational (Microwave) Spectroscopy'),
  23: lec(23, 8, 'Vibrational (IR) Spectroscopy of Diatomics'),
  24: lec(24, 8, 'Vibration-Rotation Spectra & Anharmonicity'),
  25: lec(25, 9, 'The Hydrogen Atom Schrödinger Equation & Quantum Numbers'),
  26: lec(26, 9, 'Atomic Orbitals, Radial Distributions & Angular Wavefunctions'),
  27: lec(27, 9, 'The Hydrogen Emission Spectrum & Selection Rules'),
  34: lec(34, 12, 'The H₂⁺ Molecule Ion & LCAO-MO Theory'),
  '34s': {
    label: 'L34+',
    week: 12,
    title: 'Supplement — Deriving the Secular Equation for H₂⁺',
    pdf: 'lectures/Week_12/Lecture_34_Supplement_Secular_Equation_Derivation.pdf',
  },
  35: lec(35, 12, 'Homonuclear Diatomic Molecules & MO Diagrams'),
  36: lec(36, 12, 'Heteronuclear Diatomics & Valence Bond Theory'),
} satisfies Record<string, Lecture>;

export type LectureId = keyof typeof LECTURES;
