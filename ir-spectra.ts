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

// ─── Physical constants ───────────────────────────────────────────────────────
const SPEED_OF_LIGHT_CM = 2.998e10; // cm/s
const H = 6.626e-34;                // J·s
const NA = 6.022e23;

// ─── Molecule database ────────────────────────────────────────────────────────
interface NormalMode {
    label: string;
    wavenumber: number; // cm⁻¹
    irActive: boolean;
    intensity: number;  // 0–1 relative intensity
    description: string;
}

interface Molecule {
    name: string;
    formula: string;
    modes: NormalMode[];
}

const MOLECULES: Record<string, Molecule> = {
    co2: {
        name: 'Carbon Dioxide',
        formula: 'CO₂',
        modes: [
            { label: 'ν₁ Symmetric stretch', wavenumber: 1388, irActive: false, intensity: 0.0, description: 'Symmetric stretch (IR inactive — no dipole change)' },
            { label: 'ν₂ Bending (×2)', wavenumber: 667,  irActive: true,  intensity: 1.0, description: 'Degenerate bending mode — strong IR absorption' },
            { label: 'ν₃ Asymmetric stretch', wavenumber: 2349, irActive: true,  intensity: 0.9, description: 'Asymmetric stretch — very strong IR absorption' },
        ]
    },
    h2o: {
        name: 'Water',
        formula: 'H₂O',
        modes: [
            { label: 'ν₁ Symmetric stretch', wavenumber: 3657, irActive: true, intensity: 0.6, description: 'O–H symmetric stretch' },
            { label: 'ν₂ Bending', wavenumber: 1595, irActive: true, intensity: 0.4, description: 'H–O–H scissors bend' },
            { label: 'ν₃ Asymmetric stretch', wavenumber: 3756, irActive: true, intensity: 0.8, description: 'O–H asymmetric stretch' },
        ]
    },
    hcl: {
        name: 'Hydrogen Chloride',
        formula: 'HCl',
        modes: [
            { label: 'ν₁ Stretch', wavenumber: 2886, irActive: true, intensity: 1.0, description: 'H–Cl stretching mode' },
        ]
    },
    ch4: {
        name: 'Methane',
        formula: 'CH₄',
        modes: [
            { label: 'ν₁ Symmetric stretch', wavenumber: 2917, irActive: false, intensity: 0.0, description: 'Symmetric C–H stretch (IR inactive)' },
            { label: 'ν₂ Bend (×2)', wavenumber: 1534, irActive: false, intensity: 0.0, description: 'Degenerate bending (IR inactive)' },
            { label: 'ν₃ Asymmetric stretch (×3)', wavenumber: 3019, irActive: true, intensity: 1.0, description: 'Triply degenerate C–H asymmetric stretch' },
            { label: 'ν₄ Bend (×3)', wavenumber: 1306, irActive: true, intensity: 0.7, description: 'Triply degenerate deformation' },
        ]
    },
    nh3: {
        name: 'Ammonia',
        formula: 'NH₃',
        modes: [
            { label: 'ν₁ Symmetric stretch', wavenumber: 3337, irActive: true, intensity: 0.5, description: 'N–H symmetric stretch' },
            { label: 'ν₂ Umbrella', wavenumber: 950,  irActive: true, intensity: 0.9, description: 'Umbrella (inversion) mode — characteristic of NH₃' },
            { label: 'ν₃ Asymmetric stretch (×2)', wavenumber: 3444, irActive: true, intensity: 0.8, description: 'Degenerate N–H asymmetric stretch' },
            { label: 'ν₄ Bend (×2)', wavenumber: 1627, irActive: true, intensity: 0.6, description: 'Degenerate H–N–H bending' },
        ]
    },
};

// ─── State ────────────────────────────────────────────────────────────────────
let currentMolecule: Molecule = MOLECULES['co2'];
let peakWidth = 15;       // cm⁻¹ FWHM
let freqShift = 0;        // cm⁻¹ user-applied shift

// ─── DOM ─────────────────────────────────────────────────────────────────────
const moleculeSelect  = document.getElementById('molecule-select')  as HTMLSelectElement;
const peakWidthSlider = document.getElementById('peak-width-slider') as HTMLInputElement;
const freqShiftSlider = document.getElementById('freq-shift-slider') as HTMLInputElement;
const peakWidthVal    = document.getElementById('peak-width-val')!;
const freqShiftVal    = document.getElementById('freq-shift-val')!;
const modesPanel      = document.getElementById('modes-panel')!;
const moleculeLabel   = document.getElementById('molecule-label')!;
const selectionNote   = document.getElementById('selection-note')!;

// ─── Chart setup ─────────────────────────────────────────────────────────────
const ctx = (document.getElementById('ir-chart') as HTMLCanvasElement).getContext('2d')!;
const chart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{
        label: 'IR Absorbance',
        data: [],
        borderColor: '#340E51',
        backgroundColor: 'rgba(52,14,81,0.15)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.2,
    }]},
    options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'linear',
                reverse: true,            // IR spectra shown high→low wavenumber
                title: { display: true, text: 'Wavenumber (cm⁻¹)', font: { size: 13 } },
                min: 400, max: 4000,
                ticks: { stepSize: 400 },
            },
            y: {
                title: { display: true, text: 'Absorbance (a.u.)', font: { size: 13 } },
                min: 0, max: 1.1,
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: (items) => `${Math.round(Number(items[0].label))} cm⁻¹`,
                    label: (item) => `Absorbance: ${(item.raw as number).toFixed(3)}`,
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

function generateSpectrum() {
    const N = 720;
    const xs: number[] = [];
    const ys: number[] = [];

    for (let i = 0; i <= N; i++) {
        const wn = 400 + (3600 * i) / N;
        xs.push(wn);
        let abs = 0;
        for (const mode of currentMolecule.modes) {
            if (!mode.irActive) continue;
            const center = mode.wavenumber + freqShift;
            abs += mode.intensity * lorentzian(wn, center, peakWidth);
        }
        ys.push(Math.min(abs, 1.05));
    }

    chart.data.labels = xs as any;
    chart.data.datasets[0].data = ys;
    chart.update();
}

// ─── Mode list panel ──────────────────────────────────────────────────────────
function renderModesList() {
    moleculeLabel.textContent = `${currentMolecule.name} (${currentMolecule.formula})`;
    modesPanel.innerHTML = '';

    for (const mode of currentMolecule.modes) {
        const wn = mode.wavenumber + freqShift;
        const div = document.createElement('div');
        div.className = 'mode-row';
        div.style.cssText = `
            display:flex; flex-direction:column; gap:4px;
            padding:10px 12px; border-radius:8px; margin-bottom:8px;
            background:${mode.irActive ? 'rgba(52,14,81,0.07)' : 'rgba(0,0,0,0.03)'};
            border-left: 4px solid ${mode.irActive ? 'var(--accent-color)' : '#ccc'};
        `;
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:0.88em;">${mode.label}</strong>
                <span style="font-size:0.82em; color:var(--text-dim);">${Math.round(wn)} cm⁻¹</span>
            </div>
            <div style="font-size:0.8em; color:var(--text-dim);">${mode.description}</div>
            <div style="font-size:0.78em; font-weight:600; color:${mode.irActive ? 'var(--accent-color)' : '#999'};">
                ${mode.irActive ? `IR Active · Rel. intensity: ${(mode.intensity * 100).toFixed(0)}%` : 'IR Inactive'}
            </div>
        `;
        modesPanel.appendChild(div);
    }
    selectionNote.textContent = `${currentMolecule.modes.filter(m => m.irActive).length} IR-active mode(s) of ${currentMolecule.modes.length} total`;
}

// ─── Event listeners ──────────────────────────────────────────────────────────
moleculeSelect.addEventListener('change', () => {
    currentMolecule = MOLECULES[moleculeSelect.value];
    renderModesList();
    generateSpectrum();
    refreshMath();
});

peakWidthSlider.addEventListener('input', () => {
    peakWidth = parseInt(peakWidthSlider.value);
    peakWidthVal.textContent = `${peakWidth} cm⁻¹`;
    generateSpectrum();
});

freqShiftSlider.addEventListener('input', () => {
    freqShift = parseInt(freqShiftSlider.value);
    freqShiftVal.textContent = `${freqShift > 0 ? '+' : ''}${freqShift} cm⁻¹`;
    renderModesList();
    generateSpectrum();
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
renderModesList();
generateSpectrum();
refreshMath();
