import {
    getHybridOrbitalSet,
    hybridOrbitalDensity,
    sOrbital,
    pxOrbital,
    pyOrbital,
    pzOrbital,
    getHybridEquation,
    getOrbitalComposition,
    HybridOrbital
} from './hybridization-math';
import katex from 'katex';
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
import './style.css';

/**
 * Re-renders math equations on the page using KaTeX auto-render
 */
function refreshMath() {
    (window as any).katex = katex;
    renderMathInElement(document.body, {
        delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
    });
}

// DOM Elements
const hybridizationSelect = document.getElementById('hybridization-type') as HTMLSelectElement;
const hybridOrbitalSelect = document.getElementById('hybrid-orbital-select') as HTMLSelectElement;
const containerOrbital = document.getElementById('orbital-container')!;
const containerAtomic = document.getElementById('atomic-container')!;
const equationDisplay = document.getElementById('equation-display')!;
const compositionDisplay = document.getElementById('composition-display')!;
const atomicOrbitalSelect = document.getElementById('atomic-orbital-type') as HTMLSelectElement;
const zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement;
const contourSlider = document.getElementById('contour-slider') as HTMLInputElement;

// Canvas elements
const canvasHybrid = document.createElement('canvas');
const canvasAtomic = document.createElement('canvas');

// Set canvas sizes
canvasHybrid.width = 400;
canvasHybrid.height = 400;
canvasAtomic.width = 400;
canvasAtomic.height = 400;

containerOrbital.appendChild(canvasHybrid);
containerAtomic.appendChild(canvasAtomic);

const ctxHybrid = canvasHybrid.getContext('2d')!;
const ctxAtomic = canvasAtomic.getContext('2d')!;

// Visualization parameters
let currentZoom = 1.0;
let currentContourLevel = 0.3;

/**
 * Draw 2D orbital cross-section on canvas
 */
function drawOrbitalContour(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    evaluator: (x: number, y: number) => number,
    zeta: number = 1.0
) {
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    const range = 4 / currentZoom;
    const maxDensity = 0.8;

    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
            // Convert pixel coordinates to orbital coordinates
            const x = (px / width - 0.5) * range;
            const z = (py / height - 0.5) * range;
            const y = 0; // XZ plane cross-section

            // Calculate probability density
            const density = Math.abs(evaluator(x, y, z));

            // Map to color
            let r = 0, g = 0, b = 0, a = 255;

            if (density > currentContourLevel) {
                // Positive phase (blue)
                const normalizedDensity = Math.min(density / maxDensity, 1);
                b = Math.round(255 * normalizedDensity);
                g = Math.round(100 * normalizedDensity);
                r = Math.round(50 * normalizedDensity);
                a = Math.round(150 + 105 * normalizedDensity);
            } else if (density > 0.01) {
                // Faint background
                r = 100;
                g = 100;
                b = 120;
                a = Math.round(50 * (density / currentContourLevel));
            }

            const index = (py * width + px) * 4;
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = a;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Draw axes
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#ddd';
    ctx.font = '12px monospace';
    ctx.fillText('X', width - 20, height - 5);
    ctx.fillText('Z', 5, 15);
}

/**
 * Update hybrid orbital visualization
 */
function updateHybridOrbital() {
    const hybridType = hybridizationSelect.value as 'sp' | 'sp2' | 'sp3';
    const hybridIndex = parseInt(hybridOrbitalSelect.value);

    const orbitals = getHybridOrbitalSet(hybridType);
    const hybrid = orbitals[hybridIndex];

    // Update equation display
    const equation = getHybridEquation(hybrid);
    equationDisplay.innerHTML = `\\[|\\psi_{hybrid}\\rangle = ${equation}\\]`;

    // Update composition
    const composition = getOrbitalComposition(hybrid);
    compositionDisplay.innerHTML = `
        <div class="composition-info">
            <p><strong>Orbital Composition:</strong></p>
            <p>s-orbital character: ${composition.s}%</p>
            <p>p-orbital character: ${composition.p}%</p>
            <p><strong>Geometry:</strong> ${hybrid.geometry}</p>
            <p><strong>Bond Angle:</strong> ${hybrid.angle.toFixed(1)}°</p>
        </div>
    `;

    // Draw the hybrid orbital
    drawOrbitalContour(ctxHybrid, canvasHybrid, (x, y, z) => {
        return hybridOrbitalDensity(x, y, z, hybrid);
    });

    refreshMath();
}

/**
 * Update atomic orbital visualization
 */
function updateAtomicOrbital() {
    const orbitalType = atomicOrbitalSelect.value;

    let evaluator: (x: number, y: number, z: number) => number;
    let title = '';

    switch (orbitalType) {
        case 's':
            evaluator = (x, y, z) => sOrbital(x, y, z) ** 2;
            title = 's orbital: $\\psi_{1s} = (\\pi)^{-3/4}e^{-r^2}$';
            break;
        case 'px':
            evaluator = (x, y, z) => pxOrbital(x, y, z) ** 2;
            title = 'p<sub>x</sub> orbital: $\\psi_{2p_x} = (\\pi)^{-3/4}\\sqrt{3}x e^{-r^2}$';
            break;
        case 'py':
            evaluator = (x, y, z) => pyOrbital(x, y, z) ** 2;
            title = 'p<sub>y</sub> orbital: $\\psi_{2p_y} = (\\pi)^{-3/4}\\sqrt{3}y e^{-r^2}$';
            break;
        case 'pz':
            evaluator = (x, y, z) => pzOrbital(x, y, z) ** 2;
            title = 'p<sub>z</sub> orbital: $\\psi_{2p_z} = (\\pi)^{-3/4}\\sqrt{3}z e^{-r^2}$';
            break;
        default:
            evaluator = (x, y, z) => sOrbital(x, y, z) ** 2;
            title = 's orbital';
    }

    // Update atomic orbital info
    const atomicInfo = document.getElementById('atomic-info')!;
    atomicInfo.innerHTML = title;

    // Draw the atomic orbital
    drawOrbitalContour(ctxAtomic, canvasAtomic, evaluator);

    refreshMath();
}

/**
 * Update hybrid orbital options based on hybridization type
 */
function updateHybridOptions() {
    const hybridType = hybridizationSelect.value as 'sp' | 'sp2' | 'sp3';
    const orbitals = getHybridOrbitalSet(hybridType);

    hybridOrbitalSelect.innerHTML = '';
    orbitals.forEach((orbital, index) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = orbital.name;
        hybridOrbitalSelect.appendChild(option);
    });

    updateHybridOrbital();
}

/**
 * Event Listeners
 */
hybridizationSelect.addEventListener('change', updateHybridOptions);
hybridOrbitalSelect.addEventListener('change', updateHybridOrbital);
atomicOrbitalSelect.addEventListener('change', updateAtomicOrbital);

zoomSlider.addEventListener('input', (e) => {
    currentZoom = parseFloat((e.target as HTMLInputElement).value);
    updateHybridOrbital();
    updateAtomicOrbital();
});

contourSlider.addEventListener('input', (e) => {
    currentContourLevel = parseFloat((e.target as HTMLInputElement).value);
    updateHybridOrbital();
    updateAtomicOrbital();
});

// Handle window resize
window.addEventListener('resize', () => {
    updateHybridOrbital();
    updateAtomicOrbital();
});

// Initial setup
console.log('Hybridization Visualizer Loaded');
updateHybridOptions();
updateAtomicOrbital();
