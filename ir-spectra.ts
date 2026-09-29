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

// ─── Molecule database ────────────────────────────────────────────────────────
interface NormalMode {
    label: string;
    wavenumber: number; // cm⁻¹
    irActive: boolean;
    intensity: number;  // 0–1 integrated intensity relative to the strongest band
    kmPerMol?: number;  // approximate literature integrated intensity (km/mol)
    description: string;
}

interface Molecule {
    name: string;
    formula: string;
    modes: NormalMode[];
}

// Relative intensities are approximate gas-phase integrated band intensities
// (km/mol, literature values) normalised to the strongest band of each molecule.
const MOLECULES: Record<string, Molecule> = {
    co2: {
        name: 'Carbon Dioxide',
        formula: 'CO₂',
        modes: [
            { label: 'ν₁ Symmetric stretch', wavenumber: 1388, irActive: false, intensity: 0.0, description: 'Symmetric stretch (IR inactive — no dipole change; Raman active)' },
            { label: 'ν₂ Bending (×2)', wavenumber: 667,  irActive: true,  intensity: 0.09, kmPerMol: 48,  description: 'Degenerate bending mode — medium IR absorption' },
            { label: 'ν₃ Asymmetric stretch', wavenumber: 2349, irActive: true,  intensity: 1.00, kmPerMol: 548, description: 'Asymmetric stretch — very strong IR absorption' },
        ]
    },
    h2o: {
        name: 'Water',
        formula: 'H₂O',
        modes: [
            { label: 'ν₁ Symmetric stretch', wavenumber: 3657, irActive: true, intensity: 0.05, kmPerMol: 3,  description: 'O–H symmetric stretch — weak (small dipole derivative)' },
            { label: 'ν₂ Bending', wavenumber: 1595, irActive: true, intensity: 1.00, kmPerMol: 64, description: 'H–O–H scissors bend — strongest band of gas-phase H₂O' },
            { label: 'ν₃ Asymmetric stretch', wavenumber: 3756, irActive: true, intensity: 0.70, kmPerMol: 45, description: 'O–H asymmetric stretch — strong' },
        ]
    },
    hcl: {
        name: 'Hydrogen Chloride',
        formula: 'HCl',
        modes: [
            { label: 'ν₁ Stretch', wavenumber: 2886, irActive: true, intensity: 1.0, description: 'H–Cl stretching mode (band origin; rotational P/R structure not shown)' },
        ]
    },
    ch4: {
        name: 'Methane',
        formula: 'CH₄',
        modes: [
            { label: 'ν₁ Symmetric stretch', wavenumber: 2917, irActive: false, intensity: 0.0, description: 'Symmetric C–H stretch (IR inactive)' },
            { label: 'ν₂ Bend (×2)', wavenumber: 1534, irActive: false, intensity: 0.0, description: 'Degenerate bending (IR inactive)' },
            { label: 'ν₃ Asymmetric stretch (×3)', wavenumber: 3019, irActive: true, intensity: 1.00, kmPerMol: 67, description: 'Triply degenerate C–H asymmetric stretch — strong' },
            { label: 'ν₄ Bend (×3)', wavenumber: 1306, irActive: true, intensity: 0.51, kmPerMol: 34, description: 'Triply degenerate deformation — medium-strong' },
        ]
    },
    nh3: {
        name: 'Ammonia',
        formula: 'NH₃',
        modes: [
            { label: 'ν₁ Symmetric stretch', wavenumber: 3337, irActive: true, intensity: 0.03, kmPerMol: 4,   description: 'N–H symmetric stretch — very weak' },
            { label: 'ν₂ Umbrella', wavenumber: 950,  irActive: true, intensity: 1.00, kmPerMol: 150, description: 'Umbrella (inversion) mode — very strong, characteristic of NH₃' },
            { label: 'ν₃ Asymmetric stretch (×2)', wavenumber: 3444, irActive: true, intensity: 0.03, kmPerMol: 5,   description: 'Degenerate N–H asymmetric stretch — very weak' },
            { label: 'ν₄ Bend (×2)', wavenumber: 1627, irActive: true, intensity: 0.17, kmPerMol: 25,  description: 'Degenerate H–N–H bending — medium' },
        ]
    },
};

// ─── State ────────────────────────────────────────────────────────────────────
let currentMolecule: Molecule = MOLECULES['co2'];
let peakWidth = 15;       // cm⁻¹ FWHM
let displayMode: 'transmission' | 'absorbance' = 'transmission';

// ─── DOM ─────────────────────────────────────────────────────────────────────
const peakWidthSlider = document.getElementById('peak-width-slider') as HTMLInputElement;
const peakWidthVal    = document.getElementById('peak-width-val')!;
const displayLabel    = document.getElementById('display-label')!;
const modesPanel      = document.getElementById('modes-panel')!;
const moleculeLabel   = document.getElementById('molecule-label')!;
const selectionNote   = document.getElementById('selection-note')!;

// ─── Chart setup ─────────────────────────────────────────────────────────────
const ctx = (document.getElementById('ir-chart') as HTMLCanvasElement).getContext('2d')!;
const dimWhite = 'rgba(255,255,255,0.5)';
const gridLine = 'rgba(255,255,255,0.1)';

const chart = new Chart<'line', number[], number>(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{
        label: 'IR Spectrum',
        data: [],
        borderColor: '#ffd580',
        backgroundColor: 'rgba(253,213,128,0.08)',
        borderWidth: 1.6,
        pointRadius: 0,
        fill: true,
        tension: 0,
    }]},
    options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'linear',
                reverse: true,
                title: { display: true, text: 'Wavenumber (cm⁻¹)', font: { size: 11 }, color: dimWhite },
                min: 400, max: 4000,
                ticks: { stepSize: 400, color: dimWhite, font: { size: 10 } },
                grid: { color: gridLine },
                border: { color: 'rgba(255,255,255,0.2)' },
            },
            y: {
                title: { display: true, text: 'Transmittance (%)', font: { size: 11 }, color: dimWhite },
                min: 0, max: 105,
                ticks: { color: dimWhite, font: { size: 10 } },
                grid: { color: gridLine },
                border: { color: 'rgba(255,255,255,0.2)' },
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: (items) => `${Math.round(items[0].parsed.x ?? 0)} cm⁻¹`,
                    label: (item) => `${displayMode === 'transmission' ? 'Transmittance' : 'Absorbance'}: ${(item.raw as number).toFixed(displayMode === 'transmission' ? 1 : 3)}${displayMode === 'transmission' ? '%' : ''}`,
                }
            }
        }
    }
});

// ─── Spectrum generation ──────────────────────────────────────────────────────
function lorentzian(x: number, center: number, fwhm: number): number {
    const gamma = fwhm / 2;
    return (gamma * gamma) / ((x - center) ** 2 + gamma * gamma);
}

// Peak absorbance assigned to the strongest band (intensity = 1). With
// %T = 100·10^(−A), A = 1.5 gives ≈3 %T, so strong bands dip deeply without
// flat-lining at zero, and weak bands (a few % of the strongest) stay visible.
const A_PEAK = 1.5;

function generateSpectrum() {
    const N = 3600;   // 1 cm⁻¹ grid from 400 to 4000 cm⁻¹ (band centres are integers)
    const xs: number[] = [];
    const ys: number[] = [];

    for (let i = 0; i <= N; i++) {
        const wn = 400 + (3600 * i) / N;
        xs.push(wn);
        let abs = 0;
        for (const mode of currentMolecule.modes) {
            if (!mode.irActive) continue;
            abs += A_PEAK * mode.intensity * lorentzian(wn, mode.wavenumber, peakWidth);
        }
        ys.push(displayMode === 'transmission' ? 100 * Math.pow(10, -abs) : abs);
    }
    displayLabel.textContent = displayMode === 'transmission' ? 'Transmittance' : 'Absorbance';

    // Update axis label and range based on mode
    const yScale = chart.options.scales!['y']!;
    if (displayMode === 'transmission') {
        (yScale as any).title.text = 'Transmittance (%)';
        (yScale as any).min = 0;
        (yScale as any).max = 105;
    } else {
        (yScale as any).title.text = 'Absorbance';
        (yScale as any).min = 0;
        (yScale as any).max = 1.7;
    }

    chart.data.labels = xs;
    chart.data.datasets[0].data = ys;
    chart.update();
}

// ─── Mode list panel ──────────────────────────────────────────────────────────
function renderModesList() {
    moleculeLabel.textContent = `${currentMolecule.name} (${currentMolecule.formula})`;
    modesPanel.innerHTML = '';

    for (const mode of currentMolecule.modes) {
        const wn = mode.wavenumber;
        const div = document.createElement('div');
        div.className = 'mode-row';
        div.style.cssText = `
            display:flex; flex-direction:column; gap:4px;
            padding:10px 12px; margin-bottom:8px;
            background:${mode.irActive ? 'var(--paper-2)' : 'transparent'};
            border-left: 3px solid ${mode.irActive ? 'var(--accent)' : 'var(--line)'};
        `;
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:0.88em;">${mode.label}</strong>
                <span style="font-size:0.82em; color:var(--ink-3);">${Math.round(wn)} cm⁻¹</span>
            </div>
            <div style="font-size:0.8em; color:var(--ink-2);">${mode.description}</div>
            <div style="font-size:0.78em; font-weight:600; color:${mode.irActive ? 'var(--accent)' : 'var(--ink-3)'};">
                ${mode.irActive ? `IR Active · Rel. intensity: ${(mode.intensity * 100).toFixed(0)}%${mode.kmPerMol !== undefined ? ` (≈${mode.kmPerMol} km/mol)` : ''}` : 'IR Inactive'}
            </div>
        `;
        modesPanel.appendChild(div);
    }
    selectionNote.textContent = `${currentMolecule.modes.filter(m => m.irActive).length} IR-active mode(s) of ${currentMolecule.modes.length} total`;
}

// ─── Event listeners ──────────────────────────────────────────────────────────
let spectrumTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSpectrum() {
    if (spectrumTimer) clearTimeout(spectrumTimer);
    spectrumTimer = setTimeout(generateSpectrum, 80);
}

document.querySelectorAll<HTMLButtonElement>('.mol-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.mol-chip').forEach(c => c.classList.remove('on'));
        chip.classList.add('on');
        currentMolecule = MOLECULES[chip.dataset.mol!];
        renderModesList();
        generateSpectrum();
        refreshMath();
    });
});

document.querySelectorAll<HTMLButtonElement>('.display-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.display-chip').forEach(c => c.classList.remove('on'));
        chip.classList.add('on');
        displayMode = chip.dataset.mode as 'transmission' | 'absorbance';
        generateSpectrum();
    });
});

peakWidthSlider.addEventListener('input', () => {
    peakWidth = parseInt(peakWidthSlider.value);
    peakWidthVal.textContent = `${peakWidth} cm⁻¹`;
    scheduleSpectrum();
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
renderModesList();
generateSpectrum();
refreshMath();
