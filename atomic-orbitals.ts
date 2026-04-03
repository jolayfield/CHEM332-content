import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import katex from 'katex';
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
import { getWavefunction, getProbabilityDensity } from './orbitals-math';
import './style.css';
import { initializeTheme, toggleTheme } from './src/theme-manager';

/**
 * Re-renders math equations on the page using KaTeX auto-render
 */
function refreshMath() {
    // Make katex global for auto-render if needed
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

// Visualization State
let visualizationMode: 'scatter' | 'surface' = 'scatter';

// DOM Elements
const container = document.getElementById('three-container')!;
const loadingOverlay = document.getElementById('loading-overlay')!;
const valN = document.getElementById('val-n')!;
const valL = document.getElementById('val-l')!;
const valML = document.getElementById('val-ml')!;
const valZ = document.getElementById('val-z')!;
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
camera.position.set(20, 20, 30);

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

// Grid and Axis
const gridHelper = new THREE.GridHelper(40, 40, 0x333333, 0x222222);
gridHelper.rotation.x = Math.PI / 2;
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Simulation Objects
let points: THREE.Points | null = null;
let surfaceGroup: THREE.Group | null = null;
const MAX_POINTS = 30000;
const GRID_RES = 48; // Resolution for Marching Cubes

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

        // Update UI Text with LaTeX delimiters
        valN.textContent = `$n = ${n}$`;
        valL.textContent = `$l = ${l}$`;
        valML.textContent = `$m_l = ${ml}$`;

        const elements: Record<number, string> = {
            1: 'Hydrogen', 2: 'Helium+', 3: 'Lithium++', 4: 'Beryllium+++'
        };
        valZ.textContent = `$Z = ${Z}$ (${elements[Z] || 'Ion'})`;

        const lNames = ['s', 'p', 'd', 'f'];
        orbitalName.textContent = `${n}${lNames[l]}${ml !== 0 ? ` (${ml})` : ''}`;

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

        const extent = (n * n * 5) / Math.sqrt(Z);

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
            refreshMath();
        }
    }, 100);
}

function generateScatter(n: number, l: number, ml: number, Z: number, extent: number) {
    const positions = new Float32Array(MAX_POINTS * 3);
    const colors = new Float32Array(MAX_POINTS * 3);

    let count = 0;
    let attempts = 0;
    const threshold = 0.0001 / Math.pow(n, 3);

    while (count < MAX_POINTS && attempts < MAX_POINTS * 15) {
        attempts++;
        const x = (Math.random() - 0.5) * extent * 2;
        const y = (Math.random() - 0.5) * extent * 2;
        const z = (Math.random() - 0.5) * extent * 2;
        const r = Math.sqrt(x * x + y * y + z * z);
        const theta = Math.acos(z / (r || 1));
        const phi = Math.atan2(y, x);

        const psi = getWavefunction(n, l, ml, Z, r, theta, phi);
        const prob = psi * psi;

        if (Math.random() < prob / threshold) {
            positions[count * 3] = x;
            positions[count * 3 + 1] = y;
            positions[count * 3 + 2] = z;

            if (psi > 0) {
                colors[count * 3] = 0.4; colors[count * 3 + 1] = 0.6; colors[count * 3 + 2] = 1.0;
            } else {
                colors[count * 3] = 1.0; colors[count * 3 + 1] = 0.4; colors[count * 3 + 2] = 0.4;
            }
            count++;
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, count * 3), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors.slice(0, count * 3), 3));

    const material = new THREE.PointsMaterial({
        size: 0.15,
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

    mcPos.scale.set(extent, extent, extent);
    mcNeg.scale.set(extent, extent, extent);

    // Standard Three.js MarchingCubes field manipulation
    // @ts-ignore
    const field = mcPos.field;
    // @ts-ignore
    const fieldNeg = mcNeg.field;
    field.fill(0);
    fieldNeg.fill(0);

    // Fill the grid
    for (let i = 0; i < GRID_RES; i++) {
        for (let j = 0; j < GRID_RES; j++) {
            for (let k = 0; k < GRID_RES; k++) {
                const x = ((i / (GRID_RES - 1)) - 0.5) * extent * 2;
                const y = ((j / (GRID_RES - 1)) - 0.5) * extent * 2;
                const z = ((k / (GRID_RES - 1)) - 0.5) * extent * 2;

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
    btnScatter.classList.add('active');
    btnSurface.classList.remove('active');
    updateOrbital();
};

btnSurface.onclick = () => {
    visualizationMode = 'surface';
    btnSurface.classList.add('active');
    btnScatter.classList.remove('active');
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
    controls.update();
    renderer.render(scene, camera);
}

// Initial update and math render
updateOrbital();
animate();
