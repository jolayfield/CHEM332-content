/**
 * Per-browser course progress: which simulation was visited last and which
 * ones the student has marked as done (via the ☆ button in the page nav).
 */

const STORAGE_KEY = 'qc.progress';

export interface Progress {
  lastSim: string | null;
  done: Record<string, boolean>;
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        lastSim: typeof parsed.lastSim === 'string' ? parsed.lastSim : null,
        done: parsed.done && typeof parsed.done === 'object' ? parsed.done : {},
      };
    }
  } catch { /* storage unavailable or corrupt */ }
  return { lastSim: null, done: {} };
}

function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch { /* storage unavailable */ }
}

export function recordVisit(simId: string): void {
  const p = loadProgress();
  p.lastSim = simId;
  saveProgress(p);
}

/** Toggle a simulation's done state; returns the new state. */
export function toggleDone(simId: string): boolean {
  const p = loadProgress();
  p.done[simId] = !p.done[simId];
  if (!p.done[simId]) delete p.done[simId];
  saveProgress(p);
  return !!p.done[simId];
}
