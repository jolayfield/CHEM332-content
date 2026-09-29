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
const H    = 6.626e-34;
const KB   = 1.381e-23;
const C_CM = 2.998e10;

// ─── Molecules ────────────────────────────────────────────────────────────────
// Spectroscopic constants (Huber & Herzberg), most abundant isotopologue.
// Derived quantities:
//   band origin      ν̃₀ = ωₑ − 2ωₑxₑ           (v = 0 → 1 fundamental)
//   rot. constants   B_v = Bₑ − αₑ(v + ½)
interface VibRotMolecule {
    name: string;
    formula: string;
    omegaE: number;   // harmonic wavenumber ωₑ, cm⁻¹
    omegaExe: number; // anharmonicity ωₑxₑ, cm⁻¹
    Be: number;       // equilibrium rotational constant, cm⁻¹
    alphaE: number;   // vibration–rotation coupling constant, cm⁻¹
    hasQBranch: boolean;  // ¹Σ diatomics: no Q branch; ²Π NO (Λ = 1): Q branch allowed
    groundState: string;
}

const MOLECULES: Record<string, VibRotMolecule> = {
    hcl: { name: 'HCl (¹H³⁵Cl)', formula: 'HCl', omegaE: 2990.9,  omegaExe: 52.82, Be: 10.5934, alphaE: 0.3072,  hasQBranch: false, groundState: 'X ¹Σ⁺' },
    hbr: { name: 'HBr (¹H⁷⁹Br)', formula: 'HBr', omegaE: 2648.98, omegaExe: 45.22, Be: 8.4649,  alphaE: 0.2333,  hasQBranch: false, groundState: 'X ¹Σ⁺' },
    hf:  { name: 'HF',            formula: 'HF',  omegaE: 4138.32, omegaExe: 89.88, Be: 20.9557, alphaE: 0.798,   hasQBranch: false, groundState: 'X ¹Σ⁺' },
    co:  { name: 'CO',            formula: 'CO',  omegaE: 2169.81, omegaExe: 13.29, Be: 1.93128, alphaE: 0.01750, hasQBranch: false, groundState: 'X ¹Σ⁺' },
    no:  { name: 'NO',            formula: 'NO',  omegaE: 1904.20, omegaExe: 14.08, Be: 1.67195, alphaE: 0.0171,  hasQBranch: true,  groundState: 'X ²Π' },
};

function bandOrigin(m: VibRotMolecule): number { return m.omegaE - 2 * m.omegaExe; }
function Bv(m: VibRotMolecule, v: number): number { return m.Be - m.alphaE * (v + 0.5); }

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
const qLegend        = document.getElementById('q-legend');

// ─── Chart ───────────────────────────────────────────────────────────────────
const ctx = (document.getElementById('vibrot-chart') as HTMLCanvasElement).getContext('2d')!;
type XY = { x: number; y: number | null };

const BRANCH_STYLE = {
    P: { label: 'P Branch (ΔJ = −1)', borderColor: '#e74c3c' },
    Q: { label: 'Q Branch (ΔJ = 0)',  borderColor: '#2ecc71' },
    R: { label: 'R Branch (ΔJ = +1)', borderColor: '#3498db' },
} as const;
type Branch = keyof typeof BRANCH_STYLE;

function makeDataset(branch: Branch, data: XY[]) {
    return {
        label: BRANCH_STYLE[branch].label,
        data,
        borderColor: BRANCH_STYLE[branch].borderColor,
        backgroundColor: BRANCH_STYLE[branch].borderColor,
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        spanGaps: false,
        tension: 0,
    };
}

const chart = new Chart<'line', XY[]>(ctx, {
    type: 'line',
    data: { datasets: [] },
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
                    title: (items) => `${(items[0].parsed.x ?? 0).toFixed(2)} cm⁻¹`,
                    label: (item) => `${displayMode === 'transmission' ? 'Transmittance' : 'Absorbance'} (${item.dataset.label}): ${(item.parsed.y ?? 0).toFixed(displayMode === 'transmission' ? 1 : 3)}${displayMode === 'transmission' ? '%' : ''}`,
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

// Line positions (J = J″, lower-state J), with ν̃₀ the band origin:
// ΔJ = −1  P(J):  ν̃ = ν̃₀ − (B₁+B₀)J + (B₁−B₀)J²          J = 1, 2, 3 …
function pBranchFreq(J: number): number {
    const B0 = Bv(mol, 0), B1 = Bv(mol, 1);
    return bandOrigin(mol) - (B1 + B0) * J + (B1 - B0) * J * J;
}
// ΔJ = 0   Q(J):  ν̃ = ν̃₀ + (B₁−B₀)J(J+1)
function qBranchFreq(J: number): number {
    const B0 = Bv(mol, 0), B1 = Bv(mol, 1);
    return bandOrigin(mol) + (B1 - B0) * J * (J + 1);
}
// ΔJ = +1  R(J):  ν̃ = ν̃₀ + (B₁+B₀)(J+1) + (B₁−B₀)(J+1)²   J = 0, 1, 2 …
function rBranchFreq(J: number): number {
    const B0 = Bv(mol, 0), B1 = Bv(mol, 1);
    return bandOrigin(mol) + (B1 + B0) * (J + 1) + (B1 - B0) * (J + 1) * (J + 1);
}

// Relative line strengths: Hönl–London factor × e^{−E_J/kT} (E_J from B₀).
//   R(J): (J+1)   P(J): J
//   Q(J): (2J+1)/(J(J+1)) — the Λ = 1 (²Π) Q-branch factor, which falls off as
//         ≈ 2/J; a qualitative stand-in (spin–orbit & Λ-doubling not modelled).
function boltzFactor(J: number): number {
    return Math.exp(-Bv(mol, 0) * J * (J + 1) * H * C_CM / (KB * temperature));
}
function rStrength(J: number): number { return (J + 1) * boltzFactor(J); }
function pStrength(J: number): number { return J * boltzFactor(J); }
function qStrength(J: number): number { return (2 * J + 1) / (J * (J + 1)) * boltzFactor(J); }

function lorentzian(x: number, center: number, fwhm: number): number {
    const g = fwhm / 2;
    return g * g / ((x - center) ** 2 + g * g);
}

function branchAbsorbance(
    freqFn: (J: number) => number,
    strengthFn: (J: number) => number,
    minJ: number,
    xs: number[]
): number[] {
    const ys = new Array<number>(xs.length).fill(0);
    for (let J = minJ; J <= jMax; J++) {
        const freq = freqFn(J);
        const s = strengthFn(J);
        for (let i = 0; i < xs.length; i++) {
            ys[i] += s * lorentzian(xs[i], freq, resolution);
        }
    }
    return ys;
}

// Strongest feature of the summed spectrum is scaled to this absorbance;
// %T = 100·10^(−A) then bottoms out near 3 %T instead of clipping at 0.
const A_PEAK = 1.5;

// ─── Update ───────────────────────────────────────────────────────────────────
function update() {
    const nu0 = bandOrigin(mol);
    const B0 = Bv(mol, 0);
    const B1 = Bv(mol, 1);

    // Common wavenumber grid, fine enough to resolve the narrowest lines
    const halfWidth = Math.max(B0 * jMax * 2.5, 200);
    const xMin = nu0 - halfWidth;
    const xMax = nu0 + halfWidth;
    const N = Math.min(8000, Math.max(800, Math.ceil((xMax - xMin) / (resolution / 4))));
    const xs: number[] = [];
    for (let i = 0; i <= N; i++) xs.push(xMin + (xMax - xMin) * i / N);

    const pAbs = branchAbsorbance(pBranchFreq, pStrength, 1, xs);
    const rAbs = branchAbsorbance(rBranchFreq, rStrength, 0, xs);
    const qAbs = mol.hasQBranch ? branchAbsorbance(qBranchFreq, qStrength, 1, xs) : null;

    // Total absorbance = sum over all branches, scaled so the strongest feature is A_PEAK
    const total = xs.map((_, i) => pAbs[i] + rAbs[i] + (qAbs ? qAbs[i] : 0));
    const scale = A_PEAK / (Math.max(...total) || 1);
    const A = total.map(v => v * scale);
    const yVals = displayMode === 'transmission' ? A.map(a => 100 * Math.pow(10, -a)) : A;

    // Colour the single summed trace by whichever branch contributes most at each point.
    const dominant: Branch[] = xs.map((_, i) => {
        const q = qAbs ? qAbs[i] : -1;
        if (q >= pAbs[i] && q >= rAbs[i]) return 'Q';
        return pAbs[i] >= rAbs[i] ? 'P' : 'R';
    });
    const masked = (b: Branch): XY[] => xs.map((x, i) => {
        const on = dominant[i] === b || dominant[i - 1] === b || dominant[i + 1] === b;
        return { x, y: on ? yVals[i] : null };
    });
    const branches: Branch[] = mol.hasQBranch ? ['P', 'Q', 'R'] : ['P', 'R'];
    chart.data.datasets = branches.map(b => makeDataset(b, masked(b)));

    // Axes
    const yScale = chart.options.scales!['y']!;
    if (displayMode === 'transmission') {
        (yScale as any).title.text = 'Transmittance (%)';
        yScale.min = 0;
        yScale.max = 105;
    } else {
        (yScale as any).title.text = 'Absorbance';
        yScale.min = 0;
        yScale.max = 1.7;
    }
    chart.options.scales!['x']!.min = xMin;
    chart.options.scales!['x']!.max = xMax;
    chart.update();

    if (qLegend) qLegend.style.display = mol.hasQBranch ? '' : 'none';

    // Stats
    const pops = Array.from({ length: jMax + 1 }, (_, J) => boltzmann(J, B0, temperature));
    const Jmax = pops.indexOf(Math.max(...pops));
    statsPanel.innerHTML = `
        <div><div class="k">Molecule</div><div class="v">${mol.formula}<span class="unit">${mol.groundState}</span></div></div>
        <div><div class="k">ν̃₀ (band origin)</div><div class="v">${nu0.toFixed(1)}<span class="unit">cm⁻¹</span></div></div>
        <div><div class="k">ω<sub>e</sub> (harmonic)</div><div class="v">${mol.omegaE.toFixed(2)}<span class="unit">cm⁻¹</span></div></div>
        <div><div class="k">ω<sub>e</sub>x<sub>e</sub> (anharmonicity)</div><div class="v">${mol.omegaExe.toFixed(2)}<span class="unit">cm⁻¹</span></div></div>
        <div><div class="k">B₀ (v = 0)</div><div class="v">${B0.toFixed(4)}<span class="unit">cm⁻¹</span></div></div>
        <div><div class="k">B₁ (v = 1)</div><div class="v">${B1.toFixed(4)}<span class="unit">cm⁻¹</span></div></div>
        <div><div class="k">αe = B₀ − B₁</div><div class="v">${(B0 - B1).toFixed(4)}<span class="unit">cm⁻¹</span></div></div>
        <div><div class="k">Most populated J at ${temperature} K</div><div class="v">J = ${Jmax}</div></div>
        <div><div class="k">P/R spacing (~2B₀)</div><div class="v">${(2 * B0).toFixed(3)}<span class="unit">cm⁻¹</span></div></div>
    `;

    // Branch note
    if (mol.hasQBranch) {
        branchNote.innerHTML = `<strong>${mol.formula}</strong> is linear, but its ${mol.groundState} ground state has <strong>Λ = 1</strong> (electronic orbital angular momentum about the bond axis), so the Q branch (ΔJ = 0) is allowed and appears near ν̃₀. Spin–orbit splitting and Λ-doubling are not shown.`;
    } else {
        branchNote.innerHTML = `<strong>${mol.formula}</strong> has a ${mol.groundState} ground state (Λ = 0) — the Q branch (ΔJ = 0) is forbidden. Only P and R branches appear.`;
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
        jMax = calculateJMax(Bv(mol, 0), temperature);
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
    jMax = calculateJMax(Bv(mol, 0), temperature);
    scheduleUpdate();
});

resSlider.addEventListener('input', () => {
    resolution = parseFloat(resSlider.value);
    resVal.textContent = `${resolution.toFixed(1)} cm⁻¹`;
    scheduleUpdate();
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
// Calculate initial jMax based on starting temperature
jMax = calculateJMax(Bv(mol, 0), temperature);
update();
refreshMath();
