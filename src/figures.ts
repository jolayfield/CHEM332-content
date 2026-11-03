/**
 * Text alternatives for every simulation figure. Each canvas, chart, and the
 * Bohr spectrum SVG gets role="img" and an aria-labelledby pointing to a
 * visually hidden description. The description text is fixed per figure, so the
 * accessible name never changes; live-summary pages speak their changing
 * summary only through the live region (see a11y.ts, KTD5).
 */

/** Fixed descriptions keyed by element id, one per figure. */
export const FIGURE_DESCRIPTIONS: Record<string, string> = {
  'spectrum-chart': 'Blackbody spectrum: radiance against wavelength from 100 to 2500 nanometers for the chosen temperature. The peak moves to shorter wavelengths as temperature rises. The shaded band marks visible light, 380 to 700 nanometers.',
  'sim-canvas': 'Photoelectric apparatus: light of the chosen wavelength and intensity strikes a metal plate. Electrons are ejected only when the photon energy exceeds the metal\'s work function. The readouts give photon energy, work function, and maximum kinetic energy.',
  'ke-freq-chart': 'Graph of maximum kinetic energy of ejected electrons against light wavelength or frequency, for the selected metal. Kinetic energy is zero below the threshold and rises linearly above it.',
  'pbox-canvas': 'Particle in a one-dimensional box: the wavefunction or probability density plotted across the box for the selected quantum states. The box walls are at the left and right edges. Node count and energy are in the readouts and the summary.',
  'energy-level-canvas': 'Energy level diagram of the particle in a box. Levels rise with the square of the quantum number. The selected states are highlighted.',
  'pbox2d-canvas': 'Contour plot of the wavefunction of a particle in a two-dimensional box, for the selected quantum numbers in x and y. Nodal lines are where the wavefunction is zero.',
  'barrier-canvas': 'Quantum tunneling through a finite barrier: incident, reflected, and transmitted waves, with the barrier between two regions. The readouts give transmission T and reflection R.',
  't-graph-canvas': 'Transmission probability against particle energy for the chosen barrier height and width. Transmission is small below the barrier height and rises toward one above it.',
  'bohr-canvas': 'Bohr model of hydrogen: electron orbits around the nucleus. The orbits are drawn to true scale (radius proportional to n squared) or schematically. Transitions between levels emit or absorb photons.',
  'mo-canvas': 'Molecular orbital energy diagram for the selected diatomic molecule: atomic orbitals on the left and right, molecular orbitals in the centre, with electrons filled in energy order.',
  'ir-chart': 'Infrared spectrum of the selected molecule: transmittance or absorbance against wavenumber. Each dip marks a vibrational mode that absorbs infrared light.',
  'rot-spectrum-chart': 'Rotational absorption spectrum of the selected diatomic molecule: line intensity against wavenumber. Lines are evenly spaced, with spacing equal to twice the rotational constant.',
  'rot-levels-chart': 'Boltzmann population of rotational levels J at the chosen temperature: a bar for each level, showing how many molecules occupy it.',
  'vibrot-chart': 'Vibration-rotation spectrum: P, Q, and R branches around the band origin. The branches show lines that change rotational state by minus one, zero, or plus one.',
};

/** Set role and aria-labelledby on every figure that has a description. */
export function applyFigureDescriptions(root: ParentNode = document): void {
  Object.entries(FIGURE_DESCRIPTIONS).forEach(([id, text]) => {
    const figure = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!figure || figure.dataset.described === 'true') return;
    const descId = `desc-${id}`;
    const desc = document.createElement('p');
    desc.id = descId;
    desc.className = 'sr-only';
    desc.textContent = text;
    figure.parentElement?.insertBefore(desc, figure);
    figure.setAttribute('role', 'img');
    figure.setAttribute('aria-labelledby', descId);
    figure.dataset.described = 'true';
  });
}
