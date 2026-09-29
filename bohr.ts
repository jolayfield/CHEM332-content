import './style.css';
import { initializeTheme, toggleTheme } from './src/theme-manager';
import { BohrSimulation, OrbitScale, transitionWavelengthNm } from './bohrSimulation';
import { EnergyDiagram } from './energyDiagram';


/**
 * Setup theme toggle button click handler
 */
function setupThemeToggle(): void {
  const themeToggleBtn = document.querySelector('.theme-toggle') as HTMLElement;
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      toggleTheme();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    setupThemeToggle();
    // 1. Setup Canvases
    const bohrCanvas = document.getElementById('bohr-canvas') as HTMLCanvasElement;
    const energyCanvas = document.getElementById('energy-level-canvas') as HTMLCanvasElement;

    if (!bohrCanvas || !energyCanvas) throw new Error("Canvas elements not found");

    const bohrSim = new BohrSimulation(bohrCanvas);
    const energyDiagram = new EnergyDiagram(energyCanvas);

    // 2. Controls
    const niInput = document.getElementById('initial-n') as HTMLInputElement;
    const nfInput = document.getElementById('final-n') as HTMLInputElement;

    const niVal = document.getElementById('initial-n-val') as HTMLElement;
    const nfVal = document.getElementById('final-n-val') as HTMLElement;

    const btn = document.getElementById('transition-btn') as HTMLButtonElement;

    // 3. Stats
    const deltaEStat = document.getElementById('delta-e') as HTMLElement;
    const wlStat = document.getElementById('photon-wl') as HTMLElement;
    const seriesStat = document.getElementById('series-name') as HTMLElement;

    const descEl = document.getElementById('bohr-desc') as HTMLElement | null;

    // True while the simulation is animating a transition
    let busy = false;

    // Helper to calculate physics
    const updateStats = (ni: number, nf: number) => {
        if (ni === nf) {
            // No transition: ΔE = 0, no photon
            if (deltaEStat) deltaEStat.textContent = '—';
            if (wlStat) wlStat.textContent = '—';
            if (seriesStat) seriesStat.textContent = '—';
            return;
        }

        // E = -13.6 / n^2
        const Ei = -13.6 / (ni * ni);
        const Ef = -13.6 / (nf * nf);
        const dE = Math.abs(Ef - Ei);

        // Rydberg formula: 1/λ = R_H (1/n_lower² − 1/n_upper²)
        const wl = transitionWavelengthNm(ni, nf);

        // Series Name
        let series = "Unknown";
        const lower = Math.min(ni, nf);
        if (lower === 1) series = "Lyman (UV)";
        else if (lower === 2) series = "Balmer (Visible)";
        else if (lower === 3) series = "Paschen (IR)";
        else if (lower === 4) series = "Brackett (IR)";
        else if (lower === 5) series = "Pfund (IR)";

        if (deltaEStat) deltaEStat.innerHTML = `${dE.toFixed(2)}<span class="unit">eV</span>`;
        if (wlStat) wlStat.innerHTML = `${wl.toFixed(wl < 1000 ? 1 : 0)}<span class="unit">nm</span>`;
        if (seriesStat) seriesStat.textContent = series;
    };

    // UI Update Helper (keepStats: leave the readouts showing the last transition)
    const updateUI = (keepStats = false) => {
        const ni = parseInt(niInput.value);
        const nf = parseInt(nfInput.value);

        if (niVal) niVal.textContent = `n = ${ni}`;
        if (nfVal) nfVal.textContent = `n = ${nf}`;

        if (!keepStats) updateStats(ni, nf);

        niInput.disabled = busy;
        if (busy) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.textContent = "Transitioning…";
        } else if (ni === nf) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.textContent = "Same Level";
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.textContent = ni > nf ? "Emit Photon" : "Absorb Photon";
        }
    };

    // Initial State Sync
    // We want the simulation to start at ni
    bohrSim.n = parseInt(niInput.value);
    energyDiagram.currentN = parseInt(niInput.value);
    energyDiagram.draw();

    // Event Listeners
    niInput.addEventListener('input', () => {
        // Changing n_i mid-transition would corrupt the sim state: revert and ignore
        if (busy) {
            niInput.value = bohrSim.n.toString();
            return;
        }
        updateUI();
        // Immediate feedback: snap the electron to the new initial level
        const n = parseInt(niInput.value);
        bohrSim.n = n;
        energyDiagram.currentN = n;
        energyDiagram.draw();
    });

    nfInput.addEventListener('input', () => updateUI());

    btn.addEventListener('click', async () => {
        const ni = parseInt(niInput.value);
        const nf = parseInt(nfInput.value);

        if (busy || ni === nf) return;

        busy = true;
        updateStats(ni, nf);
        updateUI(true);

        // Show transition arrow on the energy diagram
        energyDiagram.targetN = nf;
        energyDiagram.draw();

        // Wait for the simulation to report that the electron has settled
        const completed = await bohrSim.transitionTo(nf);

        busy = false;
        // Settle the diagram and sliders on the sim's actual level
        niInput.value = bohrSim.n.toString();
        energyDiagram.currentN = bohrSim.n;
        energyDiagram.targetN = null;
        energyDiagram.draw();
        // Keep the readouts on the completed transition until a slider moves
        updateUI(completed);
    });

    // Orbit scale toggle
    const scaleDesc: Record<OrbitScale, string> = {
        true: 'Orbits drawn to true scale, r<sub>n</sub> = n²a₀/Z (so r<sub>6</sub> = 36 r<sub>1</sub>). Electron relaxation emits a photon of energy ΔE = hν.',
        schematic: 'Schematic view — orbits evenly spaced, <b>not to scale</b> (true radii grow as r<sub>n</sub> = n²a₀/Z). Electron relaxation emits a photon of energy ΔE = hν.',
    };
    document.querySelectorAll<HTMLButtonElement>('.scale-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.scale-chip').forEach(c => c.classList.remove('on'));
            chip.classList.add('on');
            const mode = chip.dataset.scale as OrbitScale;
            bohrSim.orbitScale = mode;
            if (descEl) descEl.innerHTML = scaleDesc[mode];
        });
    });

    // Init
    updateUI();
});
