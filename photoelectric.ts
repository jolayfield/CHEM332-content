
import './style.css';
import { initializeTheme, toggleTheme } from './src/theme-manager';
import { Simulation } from './simulation';
import { KEGraph } from './graph';

function setupThemeToggle(): void {
    const themeToggleBtn = document.querySelector('.theme-toggle') as HTMLElement;
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => toggleTheme());
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

    const intensityInput = document.getElementById('intensity') as HTMLInputElement;
    const wavelengthInput = document.getElementById('wavelength') as HTMLInputElement;
    const intensityVal = document.getElementById('intensity-val') as HTMLElement;
    const wavelengthVal = document.getElementById('wavelength-val') as HTMLElement;
    const photonEnergyStat = document.getElementById('photon-energy') as HTMLElement;
    const workFuncStat = document.getElementById('work-function') as HTMLElement;
    const maxKeStat = document.getElementById('max-ke') as HTMLElement;

    let currentWorkFunc = 2.1;
    let currentMetalName = 'Cesium';

    const metalColors: Record<number, string> = {
        2.1: '#2196f3',
        2.3: '#ffeb3b',
        4.7: '#ff5722',
        5.1: '#ffc107'
    };

    const updateUI = () => {
        const intensity = parseInt(intensityInput.value);
        const wavelength = parseInt(wavelengthInput.value);

        sim.updateParams(wavelength, intensity, currentWorkFunc, currentMetalName);

        const freq = sim.getFrequency();
        const energy = sim.getPhotonEnergy();
        const maxKe = Math.max(0, energy - currentWorkFunc);
        const pointColor = maxKe > 0
            ? (metalColors[currentWorkFunc] ?? '#00f2ff')
            : 'rgba(123,118,129,0.5)';
        graph.update(freq, currentWorkFunc, pointColor);

        if (intensityVal) intensityVal.textContent = `${intensity}%`;
        if (wavelengthVal) wavelengthVal.textContent = `${wavelength} nm`;

        if (photonEnergyStat) photonEnergyStat.textContent = `${energy.toFixed(2)} eV`;
        if (workFuncStat) workFuncStat.textContent = `${currentWorkFunc.toFixed(2)} eV`;
        if (maxKeStat) {
            maxKeStat.textContent = `${maxKe.toFixed(2)} eV`;
            if (maxKe > 0) {
                maxKeStat.style.color = '';
                maxKeStat.style.textShadow = '';
            } else {
                maxKeStat.style.color = 'var(--ink-3)';
                maxKeStat.style.textShadow = 'none';
            }
        }
    };

    // Metal chip selection
    document.querySelectorAll<HTMLButtonElement>('.metal-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.metal-chip').forEach(c => c.classList.remove('on'));
            chip.classList.add('on');
            currentWorkFunc = parseFloat(chip.dataset.work!);
            currentMetalName = chip.dataset.name!;
            updateUI();
        });
    });

    // Graph axis chip selection
    document.querySelectorAll<HTMLButtonElement>('.axis-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.axis-chip').forEach(c => c.classList.remove('on'));
            chip.classList.add('on');
            graph.setMode(chip.dataset.axis as 'wavelength' | 'frequency');
        });
    });

    if (intensityInput) intensityInput.addEventListener('input', updateUI);
    if (wavelengthInput) wavelengthInput.addEventListener('input', updateUI);

    const resetBtn = document.getElementById('reset-graph-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            graph.reset();
            updateUI();
        });
    }

    updateUI();
});
