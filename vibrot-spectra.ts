import Chart from 'chart.js/auto';
import katex from 'katex';
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
import './style.css';
import { initializeTheme, toggleTheme } from './src/theme-manager';

function refreshMath() {
    (window as any).katex = katex;
    renderMathInElement(document.body, {
        delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
        ],
        throwOnError: false
    });
}

// ─── Constants ────────────────────────────────────────────────────────────────
const H    = 6.626e-34;
const KB   = 1.381e-23;
const C_CM = 2.998e10;

// ─── Molecules ────────────────────────────────────────────────────────────────
interface VibRotMolecule {
    name: string;
    formula: string;
    nu_e: number;     // vibrational frequency cm⁻¹
    B0: number;       // ground state rotational constant cm⁻¹
    B1: number;       // v=1 rotational constant cm⁻¹ (B1 ≈ B0 - αe)
    hasQBranch: boolean;  // linear symmetric molecules have no Q branch
}

const MOLECULES: Record<string, VibRotMolecule> = {
    hcl: { name: 'HCl (1H³⁵Cl)', formula: 'HCl', nu_e: 2886, B0: 10.440, B1: 10.136, hasQBranch: false },
    hbr: { name: 'HBr (1H⁷⁹Br)', formula: 'HBr', nu_e: 2559, B0: 8.465,  B1: 8.226,  hasQBranch: false },
    co:  { name: 'CO',            formula: 'CO',  nu_e: 2143, B0: 1.9225, B1: 1.9050, hasQBranch: false },
    no:  { name: 'NO',            formula: 'NO',  nu_e: 1876, B0: 1.7042, B1: 1.6875, hasQBranch: true  },
    hf:  { name: 'HF',            formula: 'HF',  nu_e: 3962, B0: 20.560, B1: 19.786, hasQBranch: false },
};

// ─── State ────────────────────────────────────────────────────────────────────
let mol        = MOLECULES['hcl'];
let temperature = 300;
let resolution  = 4.0;   // cm⁻¹ FWHM broadening
let jMax        = 25;    // Will be recalculated dynamically based on temperature
let displayMode: 'transmission' | 'absorbance' = 'transmission';

// ─── Utility functions ────────────────────────────────────────────────────────
/**
 * Dynamically calculate maximum J value based on temperature
 * Include states until population drops to 0.1% of maximum
 */
function calculateJMax(B: number, T: number, minPopulationFraction: number = 0.001): number {
    const pops: number[] = [];
    let J = 0;
    let maxPop = 0;

    // First pass: find maximum population and reasonable upper bound
    while (J < 500) {
        const pop = boltzmann(J, B, T);
        pops.push(pop);
        if (pop > maxPop) maxPop = pop;

        // If population has dropped significantly below max and is decreasing, we can stop searching
        if (J > 10 && pop < maxPop * minPopulationFraction) {
            break;
        }
        J++;
    }

    // Find the last J where population is above threshold
    let jMaxCalculated = 0;
    for (let i = 0; i < pops.length; i++) {
        if (pops[i] >= maxPop * minPopulationFraction) {
            jMaxCalculated = i;
        }
    }

    // Ensure reasonable minimum
    return Math.max(jMaxCalculated, 20);
}

// ─── DOM ─────────────────────────────────────────────────────────────────────
const tempSlider     = document.getElementById('temp-slider')     as HTMLInputElement;
const resSlider      = document.getElementById('res-slider')      as HTMLInputElement;
const tempVal        = document.getElementById('temp-val')!;
const resVal         = document.getElementById('res-val')!;
const statsPanel     = document.getElementById('stats-panel')!;
const branchNote     = document.getElementById('branch-note')!;

// ─── Chart ───────────────────────────────────────────────────────────────────
const ctx = (document.getElementById('vibrot-chart') as HTMLCanvasElement).getContext('2d')!;
const chart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [
        {
            label: 'P Branch',
            data: [],
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231,76,60,0.10)',
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            tension: 0.15,
        },
        {
            label: 'Q Branch',
            data: [],
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46,204,113,0.10)',
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.15,
        },
        {
            label: 'R Branch',
            data: [],
            borderColor: '#3498db',
            backgroundColor: 'rgba(52,152,219,0.10)',
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            tension: 0.15,
        },
    ]},
    options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'linear',
                title: { display: true, text: 'Wavenumber (cm⁻¹)', font: { size: 11 }, color: 'rgba(255,255,255,0.5)' },
                ticks: { maxTicksLimit: 10, color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
                grid: { color: 'rgba(255,255,255,0.1)' },
                border: { color: 'rgba(255,255,255,0.2)' },
            },
            y: {
                title: { display: true, text: 'Transmittance (%)', font: { size: 11 }, color: 'rgba(255,255,255,0.5)' },
                min: 0,
                max: 105,
                ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
                grid: { color: 'rgba(255,255,255,0.1)' },
                border: { color: 'rgba(255,255,255,0.2)' },
            }
        },
        plugins: {
            legend: { display: true, position: 'top', labels: { color: 'rgba(255,255,255,0.7)', font: { size: 11 } } },
            tooltip: {
                callbacks: {
                    title: (items) => `${Number(items[0].label).toFixed(2)} cm⁻¹`,
                    label: (item) => `${item.dataset.label}: ${(item.raw as number).toFixed(displayMode === 'transmission' ? 1 : 4)}${displayMode === 'transmission' ? '%' : ''}`,
                }
            }
        }
    }
});

// ─── Physics ──────────────────────────────────────────────────────────────────
function boltzmann(J: number, B: number, T: number): number {
    const E = B * J * (J + 1) * H * C_CM;
    return (2 * J + 1) * Math.exp(-E / (KB * T));
}

// ΔJ = -1  P branch: ν = ν_e + (B1+B0)J + (B1-B0)J²  where J = J''=1,2,3…
function pBranchFreq(J: number): number {
    return mol.nu_e - (mol.B1 + mol.B0) * J + (mol.B1 - mol.B0) * J * J;
}
// ΔJ = 0   Q branch: ν = ν_e + (B1-B0)J(J+1)
function qBranchFreq(J: number): number {
    return mol.nu_e + (mol.B1 - mol.B0) * J * (J + 1);
}
// ΔJ = +1  R branch: ν = ν_e + (B1+B0)(J+1) + (B1-B0)(J+1)²  where J = J''=0,1,2…
function rBranchFreq(J: number): number {
    return mol.nu_e + (mol.B1 + mol.B0) * (J + 1) + (mol.B1 - mol.B0) * (J + 1) * (J + 1);
}

function lorentzian(x: number, center: number, fwhm: number): number {
    const g = fwhm / 2;
    return g * g / ((x - center) ** 2 + g * g);
}

function generateBranch(
    freqFn: (J: number) => number,
    minJ: number,
    xs: number[]
): number[] {
    const ys = new Array(xs.length).fill(0);
    const pops = Array.from({ length: jMax + 1 }, (_, J) => boltzmann(J, mol.B0, temperature));
    const maxPop = Math.max(...pops);

    for (let J = minJ; J <= jMax; J++) {
        const freq = freqFn(J);
        const intensity = (pops[J] / maxPop);
        for (let i = 0; i < xs.length; i++) {
            ys[i] += intensity * lorentzian(xs[i], freq, resolution);
        }
    }
    return ys;
}

// ─── Update ───────────────────────────────────────────────────────────────────
function update() {
    // Determine plot range
    const center = mol.nu_e;
    const halfWidth = Math.max(mol.B0 * jMax * 2.5, 200);
    const xMin = center - halfWidth;
    const xMax = center + halfWidth;
    const N = 800;

    const xs: number[] = [];
    for (let i = 0; i <= N; i++) xs.push(xMin + (xMax - xMin) * i / N);

    const pBranchAbs = generateBranch(pBranchFreq, 1, xs);
    const rBranchAbs = generateBranch(rBranchFreq, 0, xs);
    const qBranchAbs = mol.hasQBranch ? generateBranch(qBranchFreq, 1, xs) : new Array(xs.length).fill(0);

    // Convert to transmittance if needed
    function toDisplay(ys: number[]): number[] {
        if (displayMode === 'transmission') {
            // Combine all branches to get total absorbance, then invert
            return ys.map(v => 100 * (1 - Math.min(v, 1.0)));
        }
        return ys;
    }

    // For transmission, combine all branches before inverting
    let pDisplay: number[], qDisplay: number[], rDisplay: number[];
    if (displayMode === 'transmission') {
        // Sum contributions then split for display (show individual branch contributions on T scale)
        pDisplay = pBranchAbs.map((v, i) => 100 * (1 - Math.min(v, 1.0)));
        qDisplay = qBranchAbs.map((v, i) => 100 * (1 - Math.min(v, 1.0)));
        rDisplay = rBranchAbs.map((v, i) => 100 * (1 - Math.min(v, 1.0)));
    } else {
        pDisplay = pBranchAbs;
        qDisplay = qBranchAbs;
        rDisplay = rBranchAbs;
    }

    // Update y-axis
    const yScale = chart.options.scales!['y']!;
    if (displayMode === 'transmission') {
        (yScale as any).title.text = 'Transmittance (%)';
        (yScale as any).min = 0;
        (yScale as any).max = 105;
    } else {
        (yScale as any).title.text = 'Absorbance (a.u.)';
        (yScale as any).min = 0;
        (yScale as any).max = undefined;
    }

    chart.data.labels = xs as any;
    chart.data.datasets[0].data = pDisplay;
    chart.data.datasets[1].data = qDisplay;
    chart.data.datasets[2].data = rDisplay;
    chart.options.scales!['x']!.min = xMin;
    chart.options.scales!['x']!.max = xMax;
    chart.update();

    // Stats
    const pops = Array.from({ length: jMax + 1 }, (_, J) => boltzmann(J, mol.B0, temperature));
    const Jmax = pops.indexOf(Math.max(...pops));
    statsPanel.innerHTML = `
        <div class="stat-item"><span class="stat-label">ν̃<sub>e</sub> (vib. freq.)</span>
            <span class="stat-value">${mol.nu_e} cm⁻¹</span></div>
        <div class="stat-item"><span class="stat-label">B₀ (ground state)</span>
            <span class="stat-value">${mol.B0.toFixed(4)} cm⁻¹</span></div>
        <div class="stat-item"><span class="stat-label">B₁ (v=1 state)</span>
            <span class="stat-value">${mol.B1.toFixed(4)} cm⁻¹</span></div>
        <div class="stat-item"><span class="stat-label">αe = B₀ − B₁</span>
            <span class="stat-value">${(mol.B0 - mol.B1).toFixed(4)} cm⁻¹</span></div>
        <div class="stat-item"><span class="stat-label">Most populated J</span>
            <span class="stat-value">J = ${Jmax} at ${temperature} K</span></div>
        <div class="stat-item"><span class="stat-label">P/R spacing (~2B₀)</span>
            <span class="stat-value">${(2 * mol.B0).toFixed(3)} cm⁻¹</span></div>
    `;

    // Branch note
    if (mol.hasQBranch) {
        branchNote.innerHTML = `<strong>${mol.formula}</strong> is a <strong>non-linear</strong> or open-shell molecule — the Q branch (ΔJ = 0) is allowed.`;
    } else {
        branchNote.innerHTML = `<strong>${mol.formula}</strong> is a <strong>linear molecule</strong> — the Q branch (ΔJ = 0) is forbidden by symmetry. Only P and R branches appear.`;
    }
}

// ─── Events ───────────────────────────────────────────────────────────────────
let updateTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleUpdate() {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(update, 80);
}

document.querySelectorAll<HTMLButtonElement>('.mol-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.mol-chip').forEach(c => c.classList.remove('on'));
        chip.classList.add('on');
        mol = MOLECULES[chip.dataset.mol!];
        jMax = calculateJMax(mol.B0, temperature);
        update();
        refreshMath();
    });
});

document.querySelectorAll<HTMLButtonElement>('.display-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.display-chip').forEach(c => c.classList.remove('on'));
        chip.classList.add('on');
        displayMode = chip.dataset.mode as 'transmission' | 'absorbance';
        update();
    });
});

tempSlider.addEventListener('input', () => {
    temperature = parseInt(tempSlider.value);
    tempVal.textContent = `${temperature} K`;
    jMax = calculateJMax(mol.B0, temperature);
    scheduleUpdate();
});

resSlider.addEventListener('input', () => {
    resolution = parseFloat(resSlider.value);
    resVal.textContent = `${resolution.toFixed(1)} cm⁻¹`;
    scheduleUpdate();
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
// Calculate initial jMax based on starting temperature
jMax = calculateJMax(mol.B0, temperature);
update();
refreshMath();
