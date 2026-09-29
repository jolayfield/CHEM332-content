import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import katex from 'katex';
import {
    getWavefunction,
    getProbabilityDensity,
    radialPart,
    angularPart,
    radialExtent,
    realOrbitalName
} from './orbitals-math';
import './style.css';

/**
 * Renders a LaTeX string into a single element (only the readouts that change,
 * rather than re-scanning the whole page on every slider move)
 */
function setMath(el: HTMLElement, tex: string) {
    katex.render(tex, el, { throwOnError: false });
}

// Visualization State
let visualizationMode: 'scatter' | 'surface' = 'scatter';

// DOM Elements
const container = document.getElementById('three-container')!;
const loadingOverlay = document.getElementById('loading-overlay')!;
const valN = document.getElementById('val-n')!;
const valL = document.getElementById('val-l')!;
const valML = document.getElementById('val-ml')!;
const valZ = document.getElementById('val-z')!;
const valZCtrl = document.getElementById('val-z-ctrl')!;
const vizModeLabel = document.getElementById('viz-mode-label')!;
const orbitalName = document.getElementById('orbital-name')!;

const inputN = document.getElementById('param-n') as HTMLInputElement;
const inputL = document.getElementById('param-l') as HTMLInputElement;
const inputML = document.getElementById('param-ml') as HTMLInputElement;
const inputZ = document.getElementById('param-z') as HTMLInputElement;
const resetBtn = document.getElementById('reset-camera') as HTMLButtonElement;

const btnScatter = document.getElementById('toggle-scatter') as HTMLButtonElement;
const btnSurface = document.getElementById('toggle-surface') as HTMLButtonElement;

// Three.js Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
// X out of plane (Three.js +Z), Y horizontal (Three.js +X), Z vertical (Three.js +Y)
camera.position.set(5, 10, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting for Surfaces
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Every orbital is drawn scaled so its 99.5% radius maps to DISPLAY_HALF world
// units, so the view is filled regardless of n and Z (physical size ∝ n²/Z).
const DISPLAY_HALF = 15;

// Chemistry convention (matches hybridization page):
//   chem X = out of plane (Three.js +Z, blue axis)
//   chem Y = horizontal    (Three.js +X, red axis)
//   chem Z = vertical      (Three.js +Y, green axis)
// Grid lies in the Three.js XZ plane = chem XY (horizontal) plane.
const gridHelper = new THREE.GridHelper(DISPLAY_HALF * 2, 20, 0x333333, 0x222222);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(DISPLAY_HALF);
scene.add(axesHelper);

// Axis labels
function makeAxisLabel(text: string, color: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3, 3, 3);
    return sprite;
}

const labelOffset = DISPLAY_HALF * 1.1;
const labelX = makeAxisLabel('X', '#4488ff');
labelX.position.set(0, 0, labelOffset);   // Three.js +Z
scene.add(labelX);

const labelY = makeAxisLabel('Y', '#ff4444');
labelY.position.set(labelOffset, 0, 0);   // Three.js +X
scene.add(labelY);

const labelZ = makeAxisLabel('Z', '#44cc44');
labelZ.position.set(0, labelOffset, 0);   // Three.js +Y
scene.add(labelZ);

// Simulation Objects
let points: THREE.Points | null = null;
let surfaceGroup: THREE.Group | null = null;
const MAX_POINTS = 30000;
const GRID_RES = 48; // Resolution for Marching Cubes

// Hydrogen-like ions for each nuclear charge (one electron)
const IONS = ['H', 'He⁺', 'Li²⁺', 'Be³⁺', 'B⁴⁺', 'C⁵⁺', 'N⁶⁺', 'O⁷⁺', 'F⁸⁺', 'Ne⁹⁺'];

/**
 * Calculates the threshold value for 90% probability volume
 */
function findNinetyPercentThreshold(n: number, l: number, ml: number, Z: number, extent: number): number {
    const densities: number[] = [];
    const step = (extent * 2) / 32; // Lower res for quick threshold estimation

    for (let x = -extent; x < extent; x += step) {
        for (let y = -extent; y < extent; y += step) {
            for (let z = -extent; z < extent; z += step) {
                const r = Math.sqrt(x * x + y * y + z * z);
                const theta = Math.acos(z / (r || 1));
                const phi = Math.atan2(y, x);
                densities.push(getProbabilityDensity(n, l, ml, Z, r, theta, phi));
            }
        }
    }

    densities.sort((a, b) => b - a);
    const total = densities.reduce((a, b) => a + b, 0);
    let cumulative = 0;
    const target = total * 0.9;

    for (const d of densities) {
        cumulative += d;
        if (cumulative >= target) return d;
    }
    return densities[densities.length - 1];
}

function updateOrbital() {
    loadingOverlay.style.display = 'flex';

    // Defer rendering to allow UI to show loading state
    setTimeout(() => {
        const n = parseInt(inputN.value);
        const l = parseInt(inputL.value);
        const ml = parseInt(inputML.value);
        const Z = parseInt(inputZ.value);

        // Update readouts (only these elements are re-rendered)
        setMath(valN, `n = ${n}`);
        setMath(valL, `l = ${l}`);
        setMath(valML, `m_l = ${ml}`);
        setMath(orbitalName, realOrbitalName(n, l, ml));

        const zLabel = `${Z} — ${IONS[Z - 1] ?? 'Ion'}`;
        valZ.textContent = zLabel;
        valZCtrl.textContent = zLabel;
        vizModeLabel.textContent = visualizationMode === 'scatter' ? 'Scatter' : '90% Surface';

        // Cleanup old objects
        if (points) {
            scene.remove(points);
            points.geometry.dispose();
            (points.material as THREE.Material).dispose();
            points = null;
        }
        if (surfaceGroup) {
            surfaceGroup.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    (child.material as THREE.Material).dispose();
                }
            });
            scene.remove(surfaceGroup);
            surfaceGroup = null;
        }

        // Physical half-width of the sampled box (a₀): radius enclosing 99.5% of the probability
        const extent = radialExtent(n, l, Z, 0.995);

        try {
            if (visualizationMode === 'scatter') {
                generateScatter(n, l, ml, Z, extent);
            } else {
                generateSurface(n, l, ml, Z, extent);
            }
        } catch (err) {
            console.error("Orbital render error:", err);
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }, 100);
}

/**
 * Draws MAX_POINTS samples from |ψ|² exactly, independent of n, l, Z:
 *   r from the radial distribution R²r² (inverse CDF of a tabulated integral),
 *   direction by rejection against the maximum of Y² (estimated on a θ,φ grid).
 * Since |ψ|² dV = R²r² dr · Y² dΩ, this is sampling relative to the orbital's own
 * maximum density, so every orbital gets the same point count.
 */
function generateScatter(n: number, l: number, ml: number, Z: number, extent: number) {
    const positions = new Float32Array(MAX_POINTS * 3);
    const colors = new Float32Array(MAX_POINTS * 3);
    const scale = DISPLAY_HALF / extent;

    // Radial CDF table on [0, extent]
    const RSTEPS = 2000;
    const dr = extent / RSTEPS;
    const cdf = new Float64Array(RSTEPS + 1);
    for (let i = 1; i <= RSTEPS; i++) {
        const r = (i - 0.5) * dr;
        const R = radialPart(n, l, Z, r);
        cdf[i] = cdf[i - 1] + R * R * r * r * dr;
    }
    const cdfTotal = cdf[RSTEPS];

    // Max of Y² over the sphere (small safety margin for grid under-estimation)
    let maxY2 = 0;
    for (let a = 0; a <= 90; a++) {
        for (let b = 0; b < 180; b++) {
            const Y = angularPart(l, ml, (a / 90) * Math.PI, (b / 180) * 2 * Math.PI);
            maxY2 = Math.max(maxY2, Y * Y);
        }
    }
    maxY2 *= 1.02;

    let count = 0;
    let attempts = 0;
    while (count < MAX_POINTS && attempts < MAX_POINTS * 50) {
        attempts++;
        const cosT = 2 * Math.random() - 1;
        const phi = Math.random() * 2 * Math.PI;
        const theta = Math.acos(cosT);
        const Y = angularPart(l, ml, theta, phi);
        if (Math.random() * maxY2 > Y * Y) continue;

        // Invert the radial CDF by binary search + linear interpolation
        const u = Math.random() * cdfTotal;
        let lo = 0, hi = RSTEPS;
        while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (cdf[mid] < u) lo = mid; else hi = mid;
        }
        const frac = (u - cdf[lo]) / ((cdf[hi] - cdf[lo]) || 1);
        const r = (lo + frac) * dr;

        const sinT = Math.sqrt(1 - cosT * cosT);
        const cx = r * sinT * Math.cos(phi);  // chem x
        const cy = r * sinT * Math.sin(phi);  // chem y
        const cz = r * cosT;                  // chem z
        const psi = radialPart(n, l, Z, r) * Y;

        // chem (x, y, z) → Three.js (y, z, x), scaled to the display box
        positions[count * 3] = cy * scale;
        positions[count * 3 + 1] = cz * scale;
        positions[count * 3 + 2] = cx * scale;

        if (psi > 0) {
            colors[count * 3] = 0.4; colors[count * 3 + 1] = 0.6; colors[count * 3 + 2] = 1.0;
        } else {
            colors[count * 3] = 1.0; colors[count * 3 + 1] = 0.4; colors[count * 3 + 2] = 0.4;
        }
        count++;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, count * 3), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors.slice(0, count * 3), 3));

    const material = new THREE.PointsMaterial({
        size: 0.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    points = new THREE.Points(geometry, material);
    scene.add(points);
}

function generateSurface(n: number, l: number, ml: number, Z: number, extent: number) {
    const isosurfaceThreshold = findNinetyPercentThreshold(n, l, ml, Z, extent);
    surfaceGroup = new THREE.Group();

    // Create materials for phases
    const matPos = new THREE.MeshPhongMaterial({
        color: 0x6699ff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        flatShading: false,
        shininess: 30
    });
    const matNeg = new THREE.MeshPhongMaterial({
        color: 0xff6666,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        flatShading: false,
        shininess: 30
    });

    // We use MarchingCubes to find the surface
    const mcPos = new MarchingCubes(GRID_RES, matPos, true, true, 100000);
    const mcNeg = new MarchingCubes(GRID_RES, matNeg, true, true, 100000);

    mcPos.scale.set(DISPLAY_HALF, DISPLAY_HALF, DISPLAY_HALF);
    mcNeg.scale.set(DISPLAY_HALF, DISPLAY_HALF, DISPLAY_HALF);

    // Standard Three.js MarchingCubes field manipulation
    // @ts-ignore
    const field = mcPos.field;
    // @ts-ignore
    const fieldNeg = mcNeg.field;
    field.fill(0);
    fieldNeg.fill(0);

    // Fill the grid. MarchingCubes places cell (i, j, k) at local
    // ((i − h)/h, (j − h)/h, (k − h)/h) along Three.js (X, Y, Z), h = GRID_RES/2.
    // Map Three.js → chem: X → chem y, Y → chem z, Z → chem x.
    const half = GRID_RES / 2;
    for (let i = 0; i < GRID_RES; i++) {
        for (let j = 0; j < GRID_RES; j++) {
            for (let k = 0; k < GRID_RES; k++) {
                const y = ((i - half) / half) * extent;
                const z = ((j - half) / half) * extent;
                const x = ((k - half) / half) * extent;

                const r = Math.sqrt(x * x + y * y + z * z);
                const theta = Math.acos(z / (r || 1));
                const phi = Math.atan2(y, x);

                const psi = getWavefunction(n, l, ml, Z, r, theta, phi);

                // Direct field access (x + y*res + z*res^2)
                const index = i + j * GRID_RES + k * GRID_RES * GRID_RES;
                field[index] = psi;
                fieldNeg[index] = -psi;
            }
        }
    }

    // Set isolation value (threshold)
    mcPos.isolation = Math.sqrt(isosurfaceThreshold);
    mcNeg.isolation = Math.sqrt(isosurfaceThreshold);

    // CRITICAL: Update the geometry
    mcPos.update();
    mcNeg.update();

    surfaceGroup.add(mcPos);
    surfaceGroup.add(mcNeg);
    scene.add(surfaceGroup);
}

// UI Handlers
btnScatter.onclick = () => {
    visualizationMode = 'scatter';
    btnScatter.classList.add('on');
    btnSurface.classList.remove('on');
    updateOrbital();
};

btnSurface.onclick = () => {
    visualizationMode = 'surface';
    btnSurface.classList.add('on');
    btnScatter.classList.remove('on');
    updateOrbital();
};

inputN.addEventListener('input', () => {
    const n = parseInt(inputN.value);
    inputL.max = (n - 1).toString();
    if (parseInt(inputL.value) >= n) inputL.value = (n - 1).toString();
    updateOrbital();
});

inputL.addEventListener('input', () => {
    const l = parseInt(inputL.value);
    inputML.min = (-l).toString();
    inputML.max = l.toString();
    if (Math.abs(parseInt(inputML.value)) > l) inputML.value = "0";
    updateOrbital();
});

inputML.addEventListener('input', updateOrbital);
inputZ.addEventListener('input', updateOrbital);
resetBtn.onclick = () => controls.reset();

window.addEventListener('resize', () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
});

function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    controls.update();
    renderer.render(scene, camera);
}

// Initial update and math render
updateOrbital();
animate();
