import './style.css';
import { initializeTheme, toggleTheme } from './src/theme-manager';
import { BarrierSimulation } from './barrierSimulation';
import { TransmissionGraph } from './transmissionGraph';


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
    const simCanvas = document.getElementById('barrier-canvas') as HTMLCanvasElement;
    const graphCanvas = document.getElementById('t-graph-canvas') as HTMLCanvasElement;

    if (!simCanvas) throw new Error("Simulation canvas not found");

    const sim = new BarrierSimulation(simCanvas);
    const tGraph = graphCanvas ? new TransmissionGraph(graphCanvas) : null;

    // Controls
    const energyInput = document.getElementById('particle-energy') as HTMLInputElement;
    const heightInput = document.getElementById('barrier-height') as HTMLInputElement;
    const widthInput = document.getElementById('barrier-width') as HTMLInputElement;

    // Displays
    const energyVal = document.getElementById('energy-val') as HTMLElement;
    const heightVal = document.getElementById('barrier-height-val') as HTMLElement;
    const widthVal = document.getElementById('barrier-width-val') as HTMLElement;

    // Stats
    const transmissionVal = document.getElementById('transmission-val') as HTMLElement;
    const reflectionVal = document.getElementById('reflection-val') as HTMLElement;
    const ratioVal = document.getElementById('ratio-val') as HTMLElement;
    const regimeVal = document.getElementById('regime-val') as HTMLElement;

    const updateUI = () => {
        const E = parseFloat(energyInput.value);
        const V0 = parseFloat(heightInput.value);
        const a = parseFloat(widthInput.value);

        sim.energy = E;
        sim.barrierHeight = V0;
        sim.barrierWidth = a;

        // Update displays
        energyVal.textContent = `${E.toFixed(1)} eV`;
        heightVal.textContent = `${V0.toFixed(1)} eV`;
        widthVal.textContent = `${a.toFixed(2)} nm`;

        // Calculate and display stats
        const T = sim.getTransmission();
        const R = sim.getReflection();
        const ratio = E / V0;

        transmissionVal.textContent = T.toFixed(4);
        reflectionVal.textContent = R.toFixed(4);
        ratioVal.textContent = ratio.toFixed(2);

        // Color-code transmission
        if (T > 0.5) {
            transmissionVal.style.color = '#4caf50';
        } else if (T > 0.01) {
            transmissionVal.style.color = '#ff9800';
        } else {
            transmissionVal.style.color = '#f44336';
        }

        // Regime indicator
        if (E < V0) {
            regimeVal.textContent = 'Tunneling';
            regimeVal.style.color = '#ff5722';
        } else {
            regimeVal.textContent = 'Classical';
            regimeVal.style.color = '#4caf50';
        }

        // Update T graph
        if (tGraph) {
            tGraph.update(E, V0, a);
        }
    };

    // Event listeners
    energyInput.addEventListener('input', updateUI);
    heightInput.addEventListener('input', updateUI);
    widthInput.addEventListener('input', updateUI);

    // Init
    updateUI();
});
