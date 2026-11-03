/**
 * Live text summaries for the simulations whose figure state changes with the
 * controls. Pure functions: no DOM access, so they can be checked directly.
 * Energies are in units of E₁ (the ground state of the box); positions are in
 * units of the box length L.
 */

export interface Summary {
  /** Spoken after a settled control change: a few sentences. */
  short: string;
  /** Read on demand (re-read key or Describe figure button). */
  full: string;
}

export interface PinnedState {
  n: number;
  c: number;
}

/** Positions of the interior nodes of state n in a box of length 1: k/n for k = 1..n-1. */
export function nodePositions(n: number): number[] {
  return Array.from({ length: n - 1 }, (_, k) => (k + 1) / n);
}

function formatPositions(positions: number[]): string {
  if (positions.length === 0) return 'none';
  return positions.map(p => `${p.toFixed(2).replace(/\.?0+$/, '')} L`).join(', ');
}

/**
 * Summary of the 1D particle-in-a-box state. With no pinned states the slider
 * state is described; with pinned states the superposition is described.
 */
export function summarizeBox1D(sliderN: number, pinned: PinnedState[]): Summary {
  if (pinned.length === 0) {
    const n = sliderN;
    const energy = n * n;
    const nodes = nodePositions(n);
    const short = `Particle in a box, state n equals ${n}. Energy ${energy} E₁. ${nodes.length} interior ${nodes.length === 1 ? 'node' : 'nodes'}.`;
    const full = `${short} Nodes at ${formatPositions(nodes)}. Wavelength ${(2 / n).toFixed(2).replace(/\.?0+$/, '')} L. Add the state to a superposition to combine states.`;
    return { short, full };
  }

  // Superposition: weights are |c|² normalized over the pinned states
  const weights = pinned.map(s => ({ n: s.n, w: s.c * s.c }));
  const total = weights.reduce((acc, s) => acc + s.w, 0) || 1;
  const normalized = weights.map(s => ({ n: s.n, w: s.w / total }));
  const meanEnergy = normalized.reduce((acc, s) => acc + s.w * s.n * s.n, 0);
  const parts = normalized.map(s => `n equals ${s.n} at ${Math.round(s.w * 100)} percent`).join(', ');
  const short = `Superposition of ${pinned.length} states: ${parts}. Mean energy ${meanEnergy.toFixed(1)} E₁.`;

  const sorted = normalized.map(s => s.n).sort((a, b) => a - b);
  const gaps = sorted.slice(1).map((n, i) => `${n * n - sorted[i] * sorted[i]} E₁`);
  const beat = gaps.length > 0
    ? ` Probability oscillates with a period of h divided by the energy gap, gaps of ${gaps.join(' and ')}.`
    : '';
  const full = `${short}${beat}`;
  return { short, full };
}

/** Interior nodal lines along one axis of length L: k·L/n for k = 1..n-1. */
function nodalLines(n: number, length: number): string {
  const pos = nodePositions(n).map(p => p * length);
  return pos.length === 0 ? 'none' : pos.map(p => `${p.toFixed(2).replace(/\.?0+$/, '')} L`).join(', ');
}

export interface Degenerate2D {
  g: number;
  partners: [number, number][];
}

/**
 * Summary of a particle in a two-dimensional box. The degenerate partners come
 * from the caller (findDegenerateStates) so this stays pure.
 */
export function summarizeBox2D(
  nx: number, ny: number, Lx: number, Ly: number, energy: number, degeneracy: Degenerate2D,
): Summary {
  const dimensions = `State (${nx}, ${ny}) in a box ${Lx.toFixed(1)} L by ${Ly.toFixed(1)} L`;
  const degen = degeneracy.g === 1
    ? 'Not degenerate.'
    : `${degeneracy.g}-fold degenerate with ${degeneracy.partners
        .filter(([a, b]) => !(a === nx && b === ny))
        .map(([a, b]) => `(${a}, ${b})`).join(', ')}.`;
  const short = `${dimensions}. Energy ${energy.toFixed(2)} in units of h squared over 8 m L squared. ${degen}`;
  const full = `${short} Nodal lines at x = ${nodalLines(nx, Lx)}, and at y = ${nodalLines(ny, Ly)}. Nodal lines split the box into ${nx * ny} cells.`;
  return { short, full };
}

export interface MOState {
  name: string;
  /** Occupied orbital labels in energy order with their electron counts */
  occupancy: { label: string; electrons: number }[];
  bondOrder: number;
  unpaired: number;
  homo: string;
  lumo: string;
}

/** Summary of a diatomic molecular orbital diagram. */
export function summarizeMO(state: MOState): Summary {
  const occupied = state.occupancy
    .filter(o => o.electrons > 0)
    .map(o => `${o.label} with ${o.electrons === 2 ? 'two' : 'one'} ${o.electrons === 2 ? 'electrons' : 'electron'}`)
    .join(', ');
  const magnetism = state.unpaired > 0
    ? `Paramagnetic, with ${state.unpaired} unpaired ${state.unpaired === 1 ? 'electron' : 'electrons'}.`
    : 'Diamagnetic, with no unpaired electrons.';
  const short = `${state.name}: bond order ${state.bondOrder}. ${magnetism}`;
  const full = `${short} Highest occupied orbital ${state.homo}; lowest unoccupied orbital ${state.lumo}. Filled in energy order: ${occupied || 'none'}.`;
  return { short, full };
}
