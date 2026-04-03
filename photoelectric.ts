
import './style.css';
import { initializeTheme, toggleTheme } from './src/theme-manager';
import { Simulation } from './simulation';
import { KEGraph } from './graph';


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
    const canvas = document.getElementById('sim-canvas') as HTMLCanvasElement;
    const graphCanvas = document.getElementById('ke-freq-chart') as HTMLCanvasElement;

    if (!canvas) throw new Error("Canvas not found");
    if (!graphCanvas) throw new Error("Graph Canvas not found");

    const sim = new Simulation(canvas);
    const graph = new KEGraph(graphCanvas);

    // Controls
    const intensityInput = document.getElementById('intensity') as HTMLInputElement;
    const wavelengthInput = document.getElementById('wavelength') as HTMLInputElement;
    const metalSelect = document.getElementById('metal') as HTMLSelectElement;

    // Displays
    const intensityVal = document.getElementById('intensity-val') as HTMLElement;
    const wavelengthVal = document.getElementById('wavelength-val') as HTMLElement;
    const colorPreview = document.getElementById('color-preview') as HTMLElement;

    const photonEnergyStat = document.getElementById('photon-energy') as HTMLElement;
    const workFuncStat = document.getElementById('work-function') as HTMLElement;
    const maxKeStat = document.getElementById('max-ke') as HTMLElement;


    const updateUI = () => {
        const intensity = parseInt(intensityInput.value);
        const wavelength = parseInt(wavelengthInput.value); // Read wavelength
        const workFunc = parseFloat(metalSelect.value);
        const metalName = metalSelect.options[metalSelect.selectedIndex].text.split('(')[0].trim();

        // Update Simulation
        sim.updateParams(wavelength, intensity, workFunc, metalName);

        // Metal Colors
        const metalColors: { [key: number]: string } = {
            2.1: '#2196f3', // Cesium (Blue)
            2.3: '#ffeb3b', // Sodium (Yellow)
            4.7: '#ff5722', // Copper (Orange)
            5.1: '#ffc107'  // Gold (Amber)
        };
        const pointColor = metalColors[workFunc] || '#00f2ff';

        // Update Graph
        // Need Frequency. Sim has helper? 
        const freq = sim.getFrequency();
        graph.update(freq, workFunc, pointColor);


        // Update Text
        if (intensityVal) intensityVal.textContent = `${intensity}%`;
        if (wavelengthVal) wavelengthVal.textContent = `${wavelength} nm`;

        // Update Color Preview
        const color = sim.wavelengthToColor(wavelength);
        if (colorPreview) {
            colorPreview.style.background = color;
            colorPreview.style.boxShadow = `0 0 10px ${color}`;
        }

        // Update Stats
        const energy = sim.getPhotonEnergy();
        const maxKe = Math.max(0, energy - workFunc);

        if (photonEnergyStat) photonEnergyStat.textContent = `${energy.toFixed(2)} eV`;
        if (workFuncStat) workFuncStat.textContent = `${workFunc.toFixed(2)} eV`;
        if (maxKeStat) {
            maxKeStat.textContent = `${maxKe.toFixed(2)} eV`;

            // Dynamic styles
            if (maxKe > 0) {
                maxKeStat.style.color = '#00f2ff';
                maxKeStat.style.textShadow = '0 0 8px rgba(0, 242, 255, 0.5)';
            } else {
                maxKeStat.style.color = '#ff073a';
                maxKeStat.style.textShadow = 'none';
            }
        }
    };

    // Listeners
    if (intensityInput) intensityInput.addEventListener('input', updateUI);
    if (wavelengthInput) wavelengthInput.addEventListener('input', updateUI);
    if (metalSelect) metalSelect.addEventListener('change', updateUI);

    const resetBtn = document.getElementById('reset-graph-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            graph.reset();
            updateUI(); // Redraw current state immediately
        });
    }

    const axisSelect = document.getElementById('graph-axis-select') as HTMLSelectElement;
    if (axisSelect) {
        axisSelect.addEventListener('change', () => {
            const mode = axisSelect.value as 'wavelength' | 'frequency';
            graph.setMode(mode);
        });
    }

    // Initial call
    updateUI();
});
