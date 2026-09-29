import Chart from 'chart.js/auto';
import katex from 'katex';
// @ts-expect-error — katex's auto-render module ships without type declarations
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
import './style.css';

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
const H     = 6.62607e-34;  // J·s
const KB    = 1.380649e-23; // J/K
const C_CM  = 2.99792e10;   // cm/s
const AMU   = 1.66054e-27;  // kg
const HC_K  = H * C_CM / KB; // second radiation constant, cm·K (≈1.4388)

// ─── Molecule database ────────────────────────────────────────────────────────
// Spectroscopic constants (Huber & Herzberg) for the most abundant isotopologue.
// The spectrum uses the v = 0 rotational constant B₀ = Bₑ − αₑ/2 (the molecules
// are in v = 0 at these temperatures). I and r are derived from B, never stored,
// so they are always self-consistent: I = h / (8π² c B), r = √(I/μ).
interface DiatomicMolecule {
    name: string;
    formula: string;
    Be: number;      // equilibrium rotational constant, cm⁻¹
    alphaE: number;  // vibration–rotation coupling constant, cm⁻¹
    mu: number;      // reduced mass, amu
    polar: boolean;  // has a permanent dipole → pure rotational (microwave) spectrum
    note?: string;
}

const MOLECULES: Record<string, DiatomicMolecule> = {
    hcl: { name: 'Hydrogen Chloride', formula: 'H³⁵Cl',  Be: 10.5934, alphaE: 0.3072,  mu: 0.979593, polar: true },
    hbr: { name: 'Hydrogen Bromide',  formula: 'H⁷⁹Br',  Be: 8.4649,  alphaE: 0.2333,  mu: 0.995129, polar: true },
    hf:  { name: 'Hydrogen Fluoride', formula: 'HF',     Be: 20.9557, alphaE: 0.798,   mu: 0.957055, polar: true },
    co:  { name: 'Carbon Monoxide',   formula: '¹²C¹⁶O', Be: 1.93128, alphaE: 0.01750, mu: 6.856209, polar: true },
    n2:  { name: 'Nitrogen',          formula: '¹⁴N₂',   Be: 1.99824, alphaE: 0.017318, mu: 7.001537, polar: false,
           note: '<strong>N₂ is nonpolar:</strong> no permanent dipole, so no microwave absorption. Its rotational constant is measured by Raman spectroscopy.' },
    no:  { name: 'Nitric Oxide',      formula: '¹⁴N¹⁶O', Be: 1.67195, alphaE: 0.0171,  mu: 7.466433, polar: true,
           note: '<strong>NO</strong> is a ²Π radical (one unpaired electron). Its real microwave spectrum is split by spin–orbit coupling and Λ-doubling, which are not shown here — this is the simple rigid-rotor pattern.' },
};

function B0Of(m: DiatomicMolecule): number {
    return m.Be - 0.5 * m.alphaE;
}

/** Moment of inertia (kg·m²) from a rotational constant in cm⁻¹. */
function inertiaFromB(B: number): number {
    return H / (8 * Math.PI * Math.PI * C_CM * B);
}

/** Bond length (Å) from a rotational constant (cm⁻¹) and reduced mass (amu). */
function bondLengthFromB(B: number, muAmu: number): number {
    return Math.sqrt(inertiaFromB(B) / (muAmu * AMU)) * 1e10;
}

// ─── State ────────────────────────────────────────────────────────────────────
let currentMol: DiatomicMolecule = MOLECULES['hcl'];
let temperature = 300;  // K
let jMax = 20;
let axisMode: 'fit' | 'common' = 'fit';
const COMMON_MAX = 700;  // cm⁻¹ — fits HF's first ~17 lines

// ─── DOM ─────────────────────────────────────────────────────────────────────
const tempSlider     = document.getElementById('temp-slider')     as HTMLInputElement;
const jMaxSlider     = document.getElementById('jmax-slider')     as HTMLInputElement;
const tempVal        = document.getElementById('temp-val')!;
const jMaxVal        = document.getElementById('jmax-val')!;
const statsPanel     = document.getElementById('stats-panel')!;
const levelsPanel    = document.getElementById('levels-panel')!;
const specEmptyNote  = document.getElementById('spec-empty-note')!;
const molNote        = document.getElementById('mol-note')!;

// ─── Charts ───────────────────────────────────────────────────────────────────
const ctxSpec  = (document.getElementById('rot-spectrum-chart') as HTMLCanvasElement).getContext('2d')!;
const ctxLevels = (document.getElementById('rot-levels-chart')  as HTMLCanvasElement).getContext('2d')!;

const dimWhite = 'rgba(255,255,255,0.5)';
const gridLine  = 'rgba(255,255,255,0.1)';
const axisBorder = 'rgba(255,255,255,0.2)';

type XY = { x: number; y: number | null };

// Stick spectrum on a true (linear) wavenumber axis: dataset 0 draws each line
// as a vertical segment (x,0)→(x,I) separated by null gaps; dataset 1 marks the
// line tips and carries the tooltips.
let tipJ: number[] = [];

const specChart = new Chart<'line', XY[]>(ctxSpec, {
    type: 'line',
    data: { datasets: [
        {
            label: 'Lines',
            data: [],
            borderColor: 'rgba(200,137,42,0.9)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 0,
            spanGaps: false,
            fill: false,
        },
        {
            label: 'Line tips',
            data: [],
            showLine: false,
            pointRadius: 2.5,
            pointHoverRadius: 5,
            pointBackgroundColor: '#ffd580',
            pointBorderWidth: 0,
        },
    ]},
    options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false, axis: 'x' },
        scales: {
            x: {
                type: 'linear',
                min: 0,
                title: { display: true, text: 'Wavenumber (cm⁻¹)', font: { size: 11 }, color: dimWhite },
                ticks: { color: dimWhite, font: { size: 10 }, maxTicksLimit: 12 },
                grid: { color: gridLine },
                border: { color: axisBorder },
            },
            y: {
                title: { display: true, text: 'Absorption intensity (rel.)', font: { size: 11 }, color: dimWhite },
                min: 0,
                max: 1.1,
                ticks: { color: dimWhite, font: { size: 10 } },
                grid: { color: gridLine },
                border: { color: axisBorder },
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                filter: (item) => item.datasetIndex === 1,
                callbacks: {
                    title: (items) => {
                        const J = tipJ[items[0].dataIndex];
                        return `J = ${J} → ${J + 1}`;
                    },
                    label: (item) => `ν̃ = ${(item.parsed.x ?? 0).toFixed(3)} cm⁻¹  |  I = ${(item.parsed.y ?? 0).toFixed(3)}`,
                }
            }
        }
    }
});

const levelsChart = new Chart<'bar', number[], string>(ctxLevels, {
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
                title: { display: true, text: 'Relative Population (2J+1)e^(−E_J/kT)', font: { size: 11 }, color: dimWhite },
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

/** Population of level J (unnormalised): (2J+1) e^{−E_J/kT}. */
function boltzmannPopulation(J: number, B: number, T: number): number {
    return (2 * J + 1) * Math.exp(-rotationalEnergy(J, B) * HC_K / T);
}

/** Rotational partition function, summed until the terms are negligible. */
function partitionFunction(B: number, T: number): number {
    let q = 0;
    for (let J = 0; J < 2000; J++) {
        const term = boltzmannPopulation(J, B, T);
        q += term;
        if (J > 5 && term < 1e-12 * q) break;
    }
    return q;
}

/**
 * Absorption intensity of the J → J+1 line (unnormalised):
 *   line strength (J+1)/(2J+1) × population (2J+1)e^{−E_J/kT}
 *   × ν̃ × (1 − e^{−hcν̃/kT})   [absorption minus stimulated emission]
 */
function lineIntensity(J: number, B: number, T: number): number {
    const nu = 2 * B * (J + 1);
    return nu * (J + 1) * Math.exp(-rotationalEnergy(J, B) * HC_K / T) * (1 - Math.exp(-nu * HC_K / T));
}

function jMostPopulated(B: number, T: number): number {
    return Math.max(0, Math.round(Math.sqrt(KB * T / (2 * H * C_CM * B)) - 0.5));
}

// ─── Update ───────────────────────────────────────────────────────────────────
function update() {
    const B = B0Of(currentMol);
    const polar = currentMol.polar;

    // Spectrum: J → J+1 transitions at ν̃ = 2B(J+1)
    const sticks: XY[] = [];
    const tips: XY[] = [];
    tipJ = [];
    if (polar) {
        const ints = Array.from({ length: jMax + 1 }, (_, J) => lineIntensity(J, B, temperature));
        const maxI = Math.max(...ints) || 1;
        for (let J = 0; J <= jMax; J++) {
            const nu = 2 * B * (J + 1);
            const I = ints[J] / maxI;
            sticks.push({ x: nu, y: 0 }, { x: nu, y: I }, { x: nu, y: null });
            tips.push({ x: nu, y: I });
            tipJ.push(J);
        }
    }
    specChart.data.datasets[0].data = sticks;
    specChart.data.datasets[1].data = tips;
    const xScale = specChart.options.scales!['x']!;
    xScale.min = 0;
    xScale.max = axisMode === 'common'
        ? COMMON_MAX
        : Math.ceil(2 * B * (jMax + 2));
    specChart.update();

    specEmptyNote.style.display = polar ? 'none' : 'flex';
    if (currentMol.note) {
        molNote.innerHTML = currentMol.note;
        molNote.style.display = '';
    } else {
        molNote.innerHTML = '';
        molNote.style.display = 'none';
    }

    // Populations
    const pops = Array.from({ length: jMax + 1 }, (_, J) => boltzmannPopulation(J, B, temperature));
    const maxPop = Math.max(...pops);
    const Q = partitionFunction(B, temperature);

    levelsChart.data.labels = pops.map((_, J) => `J=${J}`);
    levelsChart.data.datasets[0].data = pops.map(p => p / maxPop);
    levelsChart.update();

    // Stats — I and r derived from B, so they are always consistent with it
    const Jmax_pop = jMostPopulated(B, temperature);
    const I0 = inertiaFromB(B) * 1e47;
    const r0 = bondLengthFromB(B, currentMol.mu);
    const re = bondLengthFromB(currentMol.Be, currentMol.mu);
    const spacing = polar
        ? `${(2 * B).toFixed(3)}<span class="unit">cm⁻¹</span>`
        : `—<span class="unit">no MW spectrum</span>`;
    statsPanel.innerHTML = `
        <div><div class="k">Molecule</div><div class="v">${currentMol.formula}</div></div>
        <div><div class="k">B₀ (rotational constant)</div><div class="v">${B.toFixed(4)}<span class="unit">cm⁻¹</span></div></div>
        <div><div class="k">Line spacing (2B₀)</div><div class="v">${spacing}</div></div>
        <div><div class="k">Moment of inertia (I₀)</div><div class="v">${I0.toFixed(3)}<span class="unit">× 10⁻⁴⁷ kg·m²</span></div></div>
        <div><div class="k">Bond length r₀ (from B₀)</div><div class="v">${r0.toFixed(4)}<span class="unit">Å</span></div></div>
        <div><div class="k">Bond length r<sub>e</sub> (from B<sub>e</sub>)</div><div class="v">${re.toFixed(4)}<span class="unit">Å</span></div></div>
        <div><div class="k">Reduced mass (μ)</div><div class="v">${currentMol.mu.toFixed(3)}<span class="unit">amu</span></div></div>
        <div><div class="k">Most populated J at ${temperature} K</div><div class="v">J = ${Jmax_pop}</div></div>
    `;

    // Energy levels table — true fractional population N_J / q_rot
    levelsPanel.innerHTML = '';
    for (let J = 0; J <= Math.min(jMax, 8); J++) {
        const E = rotationalEnergy(J, B);
        const pct = (pops[J] / Q * 100).toFixed(1);
        const row = document.createElement('div');
        row.style.cssText = 'display:grid; grid-template-columns:2fr 2fr 2fr; gap:8px; padding:6px 8px; font-size:0.82em; border-bottom:1px solid var(--line);';
        row.innerHTML = `<span><strong>J = ${J}</strong></span><span>${E.toFixed(2)} cm⁻¹</span><span>${pct}%</span>`;
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

document.querySelectorAll<HTMLButtonElement>('.axis-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.axis-chip').forEach(c => c.classList.remove('on'));
        chip.classList.add('on');
        axisMode = chip.dataset.axis === 'common' ? 'common' : 'fit';
        update();
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
