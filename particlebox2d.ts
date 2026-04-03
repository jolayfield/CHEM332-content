import './style.css';
import { initializeTheme, toggleTheme } from './src/theme-manager';
import { ParticleBox2DSimulation } from './particleBox2DSimulation';


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
    const simCanvas = document.getElementById('pbox2d-canvas') as HTMLCanvasElement;
    if (!simCanvas) throw new Error('Canvas element not found');

    const sim = new ParticleBox2DSimulation(simCanvas);

    // Controls
    const nxInput = document.getElementById('quantum-nx') as HTMLInputElement;
    const nyInput = document.getElementById('quantum-ny') as HTMLInputElement;
    const lxInput = document.getElementById('box-lx') as HTMLInputElement;
    const lyInput = document.getElementById('box-ly') as HTMLInputElement;
    const displayMode = document.getElementById('display-mode') as HTMLSelectElement;

    // Value displays
    const nxVal = document.getElementById('nx-val') as HTMLElement;
    const nyVal = document.getElementById('ny-val') as HTMLElement;
    const lxVal = document.getElementById('lx-val') as HTMLElement;
    const lyVal = document.getElementById('ly-val') as HTMLElement;

    // Stats
    const energyValEl = document.getElementById('energy-val') as HTMLElement;
    const nodesXValEl = document.getElementById('nodes-x-val') as HTMLElement;
    const nodesYValEl = document.getElementById('nodes-y-val') as HTMLElement;
    const degeneracyValEl = document.getElementById('degeneracy-val') as HTMLElement;

    const updateUI = () => {
        const nx = parseInt(nxInput.value);
        const ny = parseInt(nyInput.value);
        const Lx = parseFloat(lxInput.value);
        const Ly = parseFloat(lyInput.value);
        const showProbability = displayMode.value === 'probability';

        // Update value displays with subscripts
        nxVal.innerHTML = `n<sub>x</sub> = ${nx}`;
        nyVal.innerHTML = `n<sub>y</sub> = ${ny}`;
        lxVal.innerHTML = `L<sub>x</sub> = ${Lx.toFixed(1)}`;
        lyVal.innerHTML = `L<sub>y</sub> = ${Ly.toFixed(1)}`;

        // Update simulation
        sim.update({ nx, ny, Lx, Ly, showProbability });

        // Stats
        const energy = sim.energy();
        energyValEl.textContent = `${energy.toFixed(2)} E₁`;
        nodesXValEl.textContent = `${nx - 1}`;
        nodesYValEl.textContent = `${ny - 1}`;

        // Degeneracy check: for a square box (Lx ≈ Ly), swapping nx↔ny gives same energy
        if (Math.abs(Lx - Ly) < 0.01 && nx !== ny) {
            degeneracyValEl.textContent = `2-fold (${nx},${ny}) ↔ (${ny},${nx})`;
        } else {
            degeneracyValEl.textContent = '—';
        }
    };

    // Wire up listeners
    nxInput.addEventListener('input', updateUI);
    nyInput.addEventListener('input', updateUI);
    lxInput.addEventListener('input', updateUI);
    lyInput.addEventListener('input', updateUI);
    displayMode.addEventListener('change', updateUI);

    // Initial draw
    updateUI();
});
