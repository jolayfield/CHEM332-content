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
const H     = 6.626e-34;   // J·s
const KB    = 1.381e-23;   // J/K
const C_CM  = 2.998e10;    // cm/s
const AMU   = 1.6605e-27;  // kg

// ─── Molecule database ────────────────────────────────────────────────────────
interface DiatomicMolecule {
    name: string;
    formula: string;
    B: number;      // rotational constant in cm⁻¹
    I: number;      // moment of inertia in kg·m² (×10⁻⁴⁷)
    re: number;     // bond length in Å
    mu: number;     // reduced mass in amu
}

const MOLECULES: Record<string, DiatomicMolecule> = {
    hcl: { name: 'Hydrogen Chloride', formula: 'HCl', B: 10.59, I: 2.644, re: 1.275, mu: 0.9796 },
    hbr: { name: 'Hydrogen Bromide',  formula: 'HBr', B: 8.47,  I: 3.307, re: 1.414, mu: 0.9954 },
    co:  { name: 'Carbon Monoxide',   formula: 'CO',  B: 1.923, I: 14.50, re: 1.128, mu: 6.857  },
    n2:  { name: 'Nitrogen',          formula: 'N₂',  B: 1.998, I: 13.95, re: 1.098, mu: 7.004  },
    no:  { name: 'Nitric Oxide',      formula: 'NO',  B: 1.705, I: 16.40, re: 1.151, mu: 7.468  },
    hf:  { name: 'Hydrogen Fluoride', formula: 'HF',  B: 20.56, I: 1.361, re: 0.917, mu: 0.9570 },
};

// ─── State ────────────────────────────────────────────────────────────────────
let currentMol: DiatomicMolecule = MOLECULES['hcl'];
let temperature = 300;  // K
let jMax = 20;

// ─── DOM ─────────────────────────────────────────────────────────────────────
const tempSlider     = document.getElementById('temp-slider')     as HTMLInputElement;
const jMaxSlider     = document.getElementById('jmax-slider')     as HTMLInputElement;
const tempVal        = document.getElementById('temp-val')!;
const jMaxVal        = document.getElementById('jmax-val')!;
const statsPanel     = document.getElementById('stats-panel')!;
const levelsPanel    = document.getElementById('levels-panel')!;

// ─── Charts ───────────────────────────────────────────────────────────────────
const ctxSpec  = (document.getElementById('rot-spectrum-chart') as HTMLCanvasElement).getContext('2d')!;
const ctxLevels = (document.getElementById('rot-levels-chart')  as HTMLCanvasElement).getContext('2d')!;

const dimWhite = 'rgba(255,255,255,0.5)';
const gridLine  = 'rgba(255,255,255,0.1)';
const axisBorder = 'rgba(255,255,255,0.2)';

const specChart = new Chart(ctxSpec, {
    type: 'bar',
    data: { labels: [], datasets: [{
        label: 'Microwave Absorption Intensity',
        data: [],
        backgroundColor: 'rgba(200,137,42,0.8)',
        borderColor: '#c8892a',
        borderWidth: 1,
        barPercentage: 0.6,
    }]},
    options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: { display: true, text: 'Wavenumber (cm⁻¹)', font: { size: 11 }, color: dimWhite },
                ticks: { color: dimWhite, font: { size: 10 } },
                grid: { color: gridLine },
                border: { color: axisBorder },
            },
            y: {
                title: { display: true, text: 'Intensity (a.u.)', font: { size: 11 }, color: dimWhite },
                min: 0,
                ticks: { color: dimWhite, font: { size: 10 } },
                grid: { color: gridLine },
                border: { color: axisBorder },
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: (items) => `J = ${items[0].dataIndex} → ${items[0].dataIndex + 1}`,
                    label: (item) => `ν = ${Number(item.label).toFixed(3)} cm⁻¹  |  I = ${(item.raw as number).toFixed(4)}`,
                }
            }
        }
    }
});

const levelsChart = new Chart(ctxLevels, {
    type: 'bar',
    data: { labels: [], datasets: [{
        label: 'Boltzmann Population',
        data: [],
        backgroundColor: (ctx) => {
            const v = (ctx.dataset.data[ctx.dataIndex] as number);
            const max = Math.max(...(ctx.dataset.data as number[]));
            const t = v / (max || 1);
            return `rgba(200,137,42,${(0.25 + 0.75 * t).toFixed(2)})`;
        },
        borderWidth: 0,
    }]},
    options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
            x: {
                title: { display: true, text: 'Relative Population', font: { size: 11 }, color: dimWhite },
                min: 0,
                ticks: { color: dimWhite, font: { size: 10 } },
                grid: { color: gridLine },
                border: { color: axisBorder },
            },
            y: {
                title: { display: true, text: 'J level', font: { size: 11 }, color: dimWhite },
                ticks: { color: dimWhite, font: { size: 10 } },
                grid: { color: gridLine },
                border: { color: axisBorder },
            }
        },
        plugins: { legend: { display: false } }
    }
});

// ─── Physics ──────────────────────────────────────────────────────────────────
function rotationalEnergy(J: number, B: number): number {
    return B * J * (J + 1);  // cm⁻¹
}

function boltzmannPopulation(J: number, B: number, T: number): number {
    const E = rotationalEnergy(J, B) * H * C_CM;  // convert to Joules
    return (2 * J + 1) * Math.exp(-E / (KB * T));
}

function jMostPopulated(B: number, T: number): number {
    return Math.round(Math.sqrt(KB * T / (2 * H * C_CM * B)) - 0.5);
}

// ─── Update ───────────────────────────────────────────────────────────────────
function update() {
    const B = currentMol.B;

    // Spectrum: J → J+1 transitions, ν = 2B(J+1)
    const specLabels: string[] = [];
    const specData: number[] = [];
    const levLabels: string[] = [];
    const levData: number[] = [];

    // Normalise Boltzmann populations
    const pops = Array.from({ length: jMax + 1 }, (_, J) => boltzmannPopulation(J, B, temperature));
    const maxPop = Math.max(...pops);

    for (let J = 0; J <= jMax; J++) {
        const freq = 2 * B * (J + 1);                 // transition frequency cm⁻¹
        const intensity = pops[J] / maxPop;           // normalised population
        specLabels.push(freq.toFixed(3));
        specData.push(intensity);

        levLabels.push(`J=${J}`);
        levData.push(pops[J] / maxPop);
    }

    specChart.data.labels = specLabels;
    specChart.data.datasets[0].data = specData;
    specChart.update();

    levelsChart.data.labels = levLabels;
    levelsChart.data.datasets[0].data = levData;
    levelsChart.update();

    // Stats
    const Jmax_pop = jMostPopulated(B, temperature);
    const I_si = currentMol.I * 1e-47;
    statsPanel.innerHTML = `
        <div class="stat-item"><span class="stat-label">Molecule</span>
            <span class="stat-value">${currentMol.formula}</span></div>
        <div class="stat-item"><span class="stat-label">B (rotational constant)</span>
            <span class="stat-value">${B.toFixed(3)} cm⁻¹</span></div>
        <div class="stat-item"><span class="stat-label">Bond length (r<sub>e</sub>)</span>
            <span class="stat-value">${currentMol.re} Å</span></div>
        <div class="stat-item"><span class="stat-label">Reduced mass (μ)</span>
            <span class="stat-value">${currentMol.mu.toFixed(3)} amu</span></div>
        <div class="stat-item"><span class="stat-label">Moment of inertia (I)</span>
            <span class="stat-value">${currentMol.I.toFixed(2)} × 10⁻⁴⁷ kg·m²</span></div>
        <div class="stat-item"><span class="stat-label">Most populated J at ${temperature} K</span>
            <span class="stat-value">J = ${Jmax_pop}</span></div>
        <div class="stat-item"><span class="stat-label">Line spacing (2B)</span>
            <span class="stat-value">${(2 * B).toFixed(3)} cm⁻¹</span></div>
    `;

    // Energy levels table
    levelsPanel.innerHTML = '';
    for (let J = 0; J <= Math.min(jMax, 8); J++) {
        const E = rotationalEnergy(J, B);
        const pop = (pops[J] / maxPop * 100).toFixed(1);
        const row = document.createElement('div');
        row.style.cssText = 'display:grid; grid-template-columns:2fr 2fr 2fr; gap:8px; padding:6px 8px; font-size:0.82em; border-bottom:1px solid var(--line);';
        row.innerHTML = `<span><strong>J = ${J}</strong></span><span>${E.toFixed(2)} cm⁻¹</span><span>${pop}%</span>`;
        levelsPanel.appendChild(row);
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
        currentMol = MOLECULES[chip.dataset.mol!];
        update();
        refreshMath();
    });
});

tempSlider.addEventListener('input', () => {
    temperature = parseInt(tempSlider.value);
    tempVal.textContent = `${temperature} K`;
    scheduleUpdate();
});

jMaxSlider.addEventListener('input', () => {
    jMax = parseInt(jMaxSlider.value);
    jMaxVal.textContent = `${jMax}`;
    scheduleUpdate();
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
update();
refreshMath();
