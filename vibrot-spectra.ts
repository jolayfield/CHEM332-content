import Chart from 'chart.js/auto';
import katex from 'katex';
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
let jMax        = 25;

// ─── DOM ─────────────────────────────────────────────────────────────────────
const moleculeSelect = document.getElementById('molecule-select') as HTMLSelectElement;
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
                title: { display: true, text: 'Wavenumber (cm⁻¹)', font: { size: 13 } },
                ticks: { maxTicksLimit: 10 },
            },
            y: {
                title: { display: true, text: 'Absorbance (a.u.)', font: { size: 13 } },
                min: 0,
            }
        },
        plugins: {
            legend: { display: true, position: 'top' },
            tooltip: {
                callbacks: {
                    title: (items) => `${Number(items[0].label).toFixed(2)} cm⁻¹`,
                    label: (item) => `${item.dataset.label}: ${(item.raw as number).toFixed(4)}`,
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

    const pBranch = generateBranch(pBranchFreq, 1, xs);
    const rBranch = generateBranch(rBranchFreq, 0, xs);
    const qBranch = mol.hasQBranch ? generateBranch(qBranchFreq, 1, xs) : new Array(xs.length).fill(0);

    chart.data.labels = xs as any;
    chart.data.datasets[0].data = pBranch;
    chart.data.datasets[1].data = qBranch;
    chart.data.datasets[2].data = rBranch;
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
moleculeSelect.addEventListener('change', () => {
    mol = MOLECULES[moleculeSelect.value];
    update();
    refreshMath();
});

tempSlider.addEventListener('input', () => {
    temperature = parseInt(tempSlider.value);
    tempVal.textContent = `${temperature} K`;
    update();
});

resSlider.addEventListener('input', () => {
    resolution = parseFloat(resSlider.value);
    resVal.textContent = `${resolution.toFixed(1)} cm⁻¹`;
    update();
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
update();
refreshMath();
