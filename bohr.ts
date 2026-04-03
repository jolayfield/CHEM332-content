import './style.css';
import { initializeTheme, toggleTheme } from './src/theme-manager';
import { BohrSimulation } from './bohrSimulation';
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

    // Helper to calculate physics
    const updateStats = (ni: number, nf: number) => {
        // E = -13.6 / n^2
        const Ei = -13.6 / (ni * ni);
        const Ef = -13.6 / (nf * nf);
        const dE = Math.abs(Ef - Ei);

        // Wavelength: E = hc / lambda -> lambda = hc / E
        // hc = 1240 eV nm
        const wl = 1240 / dE;

        // Series Name
        let series = "Unknown";
        const lower = Math.min(ni, nf);
        if (lower === 1) series = "Lyman (UV)";
        else if (lower === 2) series = "Balmer (Visible)";
        else if (lower === 3) series = "Paschen (IR)";
        else if (lower === 4) series = "Brackett (IR)";
        else if (lower === 5) series = "Pfund (IR)";

        if (deltaEStat) deltaEStat.textContent = `${dE.toFixed(2)} eV`;
        if (wlStat) wlStat.textContent = `${wl.toFixed(0)} nm`;
        if (seriesStat) seriesStat.textContent = series;
    };

    // UI Update Helper
    const updateUI = () => {
        const ni = parseInt(niInput.value);
        const nf = parseInt(nfInput.value);

        if (niVal) niVal.textContent = `n = ${ni}`;
        if (nfVal) nfVal.textContent = `n = ${nf}`;

        // Pre-calculate stats for preview?
        updateStats(ni, nf);

        // Visual validation: Disable button if ni == nf?
        if (ni === nf) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.textContent = "Same Level";
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.textContent = ni > nf ? "Emit Photon" : "Absorb Photon";
        }

        // Sync initial state visually?
        // Only if not animating?
        // For now, let's trust the simulation state is separate until button click
    };

    // Initial State Sync
    // We want the simulation to start at ni
    bohrSim.n = parseInt(niInput.value);
    energyDiagram.currentN = parseInt(niInput.value);
    energyDiagram.draw();

    // Event Listeners
    niInput.addEventListener('input', () => {
        updateUI();
        // optionally update sim immediately?
        // bohrSim.n = parseInt(niInput.value); // Snap to new N
        // energyDiagram.currentN = parseInt(niInput.value); 
        // energyDiagram.draw(); 
        // Better to wait for button? No, immediate feedback is better for "Initial Level"
        const n = parseInt(niInput.value);
        bohrSim.n = n;
        energyDiagram.currentN = n;
        energyDiagram.draw();
    });

    nfInput.addEventListener('input', updateUI);

    btn.addEventListener('click', () => {
        const ni = parseInt(niInput.value);
        const nf = parseInt(nfInput.value);

        if (ni === nf) return;

        // Trigger
        bohrSim.transitionTo(nf);

        // Update Energy Diagram to show transition arrow?
        energyDiagram.targetN = nf;
        energyDiagram.draw();

        // Update stats
        updateStats(ni, nf);

        // After animation completes (timeout approximation), update inputs?
        // Or keep inputs independent?
        // Let's update inputs to reflect new state after transition
        setTimeout(() => {
            niInput.value = nf.toString();
            updateUI();
            energyDiagram.currentN = nf; // Settle
            energyDiagram.targetN = null;
            energyDiagram.draw();
        }, 2000); // 2 seconds for animation roughly?
    });

    // Init
    updateUI();
});
