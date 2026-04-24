import './style.css';
import { initializeTheme, toggleTheme } from './src/theme-manager';
import { ParticleBoxSimulation, ParticleBoxEnergyDiagram } from './particleBoxSimulation';


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
    const simCanvas = document.getElementById('pbox-canvas') as HTMLCanvasElement;
    const energyCanvas = document.getElementById('energy-level-canvas') as HTMLCanvasElement;

    if (!simCanvas || !energyCanvas) throw new Error("Canvas elements not found");

    const sim = new ParticleBoxSimulation(simCanvas);
    const energyDiagram = new ParticleBoxEnergyDiagram(energyCanvas);

    // Controls
    const nInput = document.getElementById('quantum-n') as HTMLInputElement;
    const nVal = document.getElementById('quantum-n-val') as HTMLElement;
    let showProbabilityMode = false;

    // Superposition Controls
    const addStateBtn = document.getElementById('add-state') as HTMLButtonElement;
    const clearStatesBtn = document.getElementById('clear-states') as HTMLButtonElement;
    const coefficientsBody = document.getElementById('coefficients-body') as HTMLElement;

    // Animation Controls
    const animateBtn = document.getElementById('toggle-animate') as HTMLButtonElement;
    const resetBtn = document.getElementById('reset-animate') as HTMLButtonElement;

    // Stats
    const energyValEl = document.getElementById('energy-val') as HTMLElement;
    const nodesValEl = document.getElementById('nodes-val') as HTMLElement;
    const wavelengthValEl = document.getElementById('wavelength-val') as HTMLElement;

    const renderTable = (allStates: { n: number, c: number, isPreview: boolean }[]) => {
        coefficientsBody.innerHTML = '';
        allStates.forEach(state => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid var(--border-color)';

            // n column
            const nCell = document.createElement('td');
            nCell.style.padding = '0.5rem';
            nCell.style.borderRight = '1px solid var(--border-color)';
            nCell.textContent = state.isPreview ? `n=${state.n} (preview)` : `n=${state.n}`;
            if (state.isPreview) nCell.style.color = 'var(--text-dim)';
            row.appendChild(nCell);

            // coefficient column
            const cCell = document.createElement('td');
            cCell.style.padding = '0.5rem';
            cCell.style.borderRight = '1px solid var(--border-color)';
            if (state.isPreview) {
                cCell.textContent = '1.0';
                cCell.style.color = 'var(--text-dim)';
            } else {
                const input = document.createElement('input');
                input.type = 'number';
                input.value = state.c.toString();
                input.step = '0.1';
                input.style.width = '60px';
                input.style.padding = '0.2rem';
                input.style.border = '1px solid var(--border-color)';
                input.style.borderRadius = '4px';
                input.addEventListener('input', () => {
                    const idx = sim.pinnedStates.findIndex(s => s.n === state.n);
                    if (idx !== -1) {
                        sim.pinnedStates[idx].c = parseFloat(input.value) || 1.0;
                    }
                });
                cCell.appendChild(input);
            }
            row.appendChild(cCell);

            // remove column
            const removeCell = document.createElement('td');
            removeCell.style.padding = '0.5rem';
            removeCell.style.textAlign = 'right';
            if (!state.isPreview) {
                const removeBtn = document.createElement('button');
                removeBtn.innerHTML = '&times;';
                removeBtn.className = 'btn btn-outline';
                removeBtn.style.padding = '0.1rem 0.4rem';
                removeBtn.title = 'Remove state';
                removeBtn.onclick = () => {
                    sim.pinnedStates = sim.pinnedStates.filter(s => s.n !== state.n);
                    updateUI();
                };
                removeCell.appendChild(removeBtn);
            }
            row.appendChild(removeCell);

            coefficientsBody.appendChild(row);
        });
    }

    const updateUI = () => {
        const n = parseInt(nInput.value);
        sim.previewN = n;

        // Display mode
        sim.showProbability = showProbabilityMode;

        const allStates = sim.pinnedStates.map(s => ({ ...s, isPreview: false }));
        if (!sim.pinnedStates.some(s => s.n === sim.previewN)) {
            allStates.push({ n: sim.previewN, c: 1.0, isPreview: true });
        }
        allStates.sort((a, b) => a.n - b.n);

        const isSuperposition = allStates.length > 1;

        // Animation state
        animateBtn.textContent = sim.isAnimating ? 'Pause' : 'Animate Wavefunction';

        // Update displays
        nVal.textContent = `n = ${n}`;
        if (isSuperposition) {
            energyValEl.textContent = 'Superposition';
            nodesValEl.textContent = 'N/A';
            wavelengthValEl.textContent = 'N/A';
        } else {
            energyValEl.textContent = `${n * n} E₁`;
            nodesValEl.textContent = `${n - 1}`;
            if (n === 1) wavelengthValEl.textContent = '2L';
            else if (n === 2) wavelengthValEl.textContent = 'L';
            else wavelengthValEl.textContent = `2L/${n}`;
        }

        renderTable(allStates);

        // Update energy diagram
        energyDiagram.activeStates = allStates.map(s => s.n);
        energyDiagram.draw();
    };

    // Event listeners
    nInput.addEventListener('input', updateUI);

    document.querySelectorAll<HTMLButtonElement>('.display-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.display-chip').forEach(c => c.classList.remove('on'));
            chip.classList.add('on');
            showProbabilityMode = chip.dataset.mode === 'probability';
            updateUI();
        });
    });

    addStateBtn.addEventListener('click', () => {
        const n = parseInt(nInput.value);
        if (!sim.pinnedStates.some(s => s.n === n)) {
            sim.pinnedStates.push({ n: n, c: 1.0 });
            sim.pinnedStates.sort((a, b) => a.n - b.n);
        }
        updateUI();
    });

    clearStatesBtn.addEventListener('click', () => {
        sim.pinnedStates = [];
        updateUI();
    });

    animateBtn.addEventListener('click', () => {
        sim.isAnimating = !sim.isAnimating;
        updateUI();
    });

    resetBtn.addEventListener('click', () => {
        sim.resetTime();
        sim.isAnimating = false;
        updateUI();
    });

    const speedInput = document.getElementById('animation-speed') as HTMLInputElement;
    const speedVal = document.getElementById('speed-val') as HTMLElement;

    speedInput.addEventListener('input', () => {
        const val = parseFloat(speedInput.value);
        sim.animationSpeed = val;
        speedVal.textContent = val.toFixed(1);
    });

    // Init
    updateUI();
});
