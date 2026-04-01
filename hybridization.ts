import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import katex from 'katex';
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
import {
    getHybridOrbitalSet,
    hybridOrbitalWavefunction,
    getHybridEquation,
    getOrbitalComposition,
    HybridOrbital
} from './hybridization-math';
import './style.css';

// ─── KaTeX ───────────────────────────────────────────────────────────────────
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

// ─── DOM ─────────────────────────────────────────────────────────────────────
const container       = document.getElementById('three-container')!;
const loadingOverlay  = document.getElementById('loading-overlay')!;
const hybridTypeEl    = document.getElementById('hybridization-type') as HTMLSelectElement;
const orbitalIndexEl  = document.getElementById('hybrid-orbital-select') as HTMLSelectElement;
const btnScatter      = document.getElementById('toggle-scatter') as HTMLButtonElement;
const btnSurface      = document.getElementById('toggle-surface') as HTMLButtonElement;
const resetBtn        = document.getElementById('reset-camera') as HTMLButtonElement;
const equationEl      = document.getElementById('equation-display')!;
const compositionEl   = document.getElementById('composition-display')!;
const orbitalLabelEl  = document.getElementById('orbital-label')!;

// ─── Three.js ────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.01, 200);
camera.position.set(6, 5, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(8, 12, 8);
scene.add(dirLight);

// Axes
scene.add(new THREE.AxesHelper(3));

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
    sprite.scale.set(0.8, 0.8, 0.8);
    return sprite;
}

const labelX = makeAxisLabel('X', '#ff4444');
labelX.position.set(3.8, 0, 0);
scene.add(labelX);

const labelY = makeAxisLabel('Y', '#44ff44');
labelY.position.set(0, 3.8, 0);
scene.add(labelY);

const labelZ = makeAxisLabel('Z', '#4488ff');
labelZ.position.set(0, 0, 3.8);
scene.add(labelZ);

// ─── State ───────────────────────────────────────────────────────────────────
let vizMode: 'scatter' | 'surface' = 'surface';
let points: THREE.Points | null = null;
let surfaceGroup: THREE.Group | null = null;

const EXTENT    = 3.5;   // world units covering the orbital cloud
const GRID_RES  = 52;    // marching-cubes grid resolution
const MAX_PTS   = 30000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Remove old geometry from scene and dispose GPU resources */
function clearScene() {
    if (points) {
        scene.remove(points);
        points.geometry.dispose();
        (points.material as THREE.Material).dispose();
        points = null;
    }
    if (surfaceGroup) {
        surfaceGroup.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                (child.material as THREE.Material).dispose();
            }
        });
        scene.remove(surfaceGroup);
        surfaceGroup = null;
    }
}

/** Sample the wavefunction to find an adaptive scatter threshold */
function findScatterThreshold(hybrid: HybridOrbital): number {
    const densities: number[] = [];
    const step = EXTENT * 2 / 20;
    for (let x = -EXTENT; x < EXTENT; x += step)
        for (let y = -EXTENT; y < EXTENT; y += step)
            for (let z = -EXTENT; z < EXTENT; z += step) {
                const psi = hybridOrbitalWavefunction(x, y, z, hybrid);
                densities.push(psi * psi);
            }
    densities.sort((a, b) => b - a);
    return densities[Math.floor(densities.length * 0.005)] || 0.0001;
}

/** Find isosurface threshold enclosing ~90 % of the probability density */
function findSurfaceThreshold(hybrid: HybridOrbital): number {
    const densities: number[] = [];
    const step = EXTENT * 2 / 28;
    for (let x = -EXTENT; x < EXTENT; x += step)
        for (let y = -EXTENT; y < EXTENT; y += step)
            for (let z = -EXTENT; z < EXTENT; z += step)
                densities.push(Math.abs(hybridOrbitalWavefunction(x, y, z, hybrid)));
    densities.sort((a, b) => b - a);
    const total = densities.reduce((a, b) => a + b, 0);
    let cumul = 0;
    for (const d of densities) {
        cumul += d;
        if (cumul >= total * 0.90) return d;
    }
    return densities[densities.length - 1];
}

// ─── Scatter rendering ────────────────────────────────────────────────────────
function buildScatter(hybrid: HybridOrbital) {
    const threshold = findScatterThreshold(hybrid);
    const positions = new Float32Array(MAX_PTS * 3);
    const colorsArr = new Float32Array(MAX_PTS * 3);

    let count = 0, attempts = 0;
    while (count < MAX_PTS && attempts < MAX_PTS * 20) {
        attempts++;
        const x = (Math.random() - 0.5) * EXTENT * 2;
        const y = (Math.random() - 0.5) * EXTENT * 2;
        const z = (Math.random() - 0.5) * EXTENT * 2;
        const psi = hybridOrbitalWavefunction(x, y, z, hybrid);
        const density = psi * psi;

        if (Math.random() < density / threshold) {
            positions[count * 3]     = x;
            positions[count * 3 + 1] = y;
            positions[count * 3 + 2] = z;
            // blue = positive phase, red = negative phase
            if (psi >= 0) {
                colorsArr[count * 3] = 0.4; colorsArr[count * 3 + 1] = 0.6; colorsArr[count * 3 + 2] = 1.0;
            } else {
                colorsArr[count * 3] = 1.0; colorsArr[count * 3 + 1] = 0.4; colorsArr[count * 3 + 2] = 0.4;
            }
            count++;
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, count * 3), 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colorsArr.slice(0,  count * 3), 3));

    const mat = new THREE.PointsMaterial({
        size: 0.06, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true
    });
    points = new THREE.Points(geo, mat);
    scene.add(points);
}

// ─── Surface (MarchingCubes) rendering ───────────────────────────────────────
function buildSurface(hybrid: HybridOrbital) {
    const isoVal = findSurfaceThreshold(hybrid);
    surfaceGroup = new THREE.Group();

    const matPos = new THREE.MeshPhongMaterial({
        color: 0x6699ff, transparent: true, opacity: 0.72,
        side: THREE.DoubleSide, shininess: 40
    });
    const matNeg = new THREE.MeshPhongMaterial({
        color: 0xff6644, transparent: true, opacity: 0.72,
        side: THREE.DoubleSide, shininess: 40
    });

    const mcPos = new MarchingCubes(GRID_RES, matPos, true, true, 100000);
    const mcNeg = new MarchingCubes(GRID_RES, matNeg, true, true, 100000);
    mcPos.scale.set(EXTENT, EXTENT, EXTENT);
    mcNeg.scale.set(EXTENT, EXTENT, EXTENT);

    // @ts-ignore
    const fieldPos: Float32Array = mcPos.field;
    // @ts-ignore
    const fieldNeg: Float32Array = mcNeg.field;
    fieldPos.fill(0);
    fieldNeg.fill(0);

    for (let i = 0; i < GRID_RES; i++) {
        for (let j = 0; j < GRID_RES; j++) {
            for (let k = 0; k < GRID_RES; k++) {
                const x = ((i / (GRID_RES - 1)) - 0.5) * EXTENT * 2;
                const y = ((j / (GRID_RES - 1)) - 0.5) * EXTENT * 2;
                const z = ((k / (GRID_RES - 1)) - 0.5) * EXTENT * 2;
                const psi = hybridOrbitalWavefunction(x, y, z, hybrid);
                const idx = i + j * GRID_RES + k * GRID_RES * GRID_RES;
                fieldPos[idx] =  psi;
                fieldNeg[idx] = -psi;
            }
        }
    }

    mcPos.isolation = isoVal;
    mcNeg.isolation = isoVal;
    mcPos.update();
    mcNeg.update();

    surfaceGroup.add(mcPos);
    surfaceGroup.add(mcNeg);
    scene.add(surfaceGroup);
}

// ─── Main update ─────────────────────────────────────────────────────────────
function updateViz() {
    loadingOverlay.style.display = 'flex';
    setTimeout(() => {
        try {
            const hybridType = hybridTypeEl.value as 'sp' | 'sp2' | 'sp3';
            const idx        = parseInt(orbitalIndexEl.value);
            const orbitals   = getHybridOrbitalSet(hybridType);
            const hybrid     = orbitals[idx];

            clearScene();

            if (vizMode === 'scatter') buildScatter(hybrid);
            else                       buildSurface(hybrid);

            // Update sidebar info
            const eq   = getHybridEquation(hybrid);
            const comp = getOrbitalComposition(hybrid);

            equationEl.innerHTML = `\\[|\\psi_{\\text{hybrid}}\\rangle = ${eq}\\]`;

            orbitalLabelEl.textContent = hybrid.name;

            compositionEl.innerHTML = `
                <div class="stat-item"><span class="stat-label">Geometry</span>
                    <span class="stat-value">${hybrid.geometry}</span></div>
                <div class="stat-item"><span class="stat-label">Bond Angle</span>
                    <span class="stat-value">${hybrid.angle.toFixed(2)}°</span></div>
                <div class="stat-item"><span class="stat-label">s character</span>
                    <span class="stat-value">${comp.s}%</span></div>
                <div class="stat-item"><span class="stat-label">p character</span>
                    <span class="stat-value">${comp.p}%</span></div>`;
        } catch (e) {
            console.error('Hybridization render error:', e);
        } finally {
            loadingOverlay.style.display = 'none';
            refreshMath();
        }
    }, 80);
}

// ─── Orbital selector population ─────────────────────────────────────────────
function populateOrbitalSelector() {
    const hybridType = hybridTypeEl.value as 'sp' | 'sp2' | 'sp3';
    const orbitals   = getHybridOrbitalSet(hybridType);
    orbitalIndexEl.innerHTML = '';
    orbitals.forEach((o, i) => {
        const opt = document.createElement('option');
        opt.value = i.toString();
        opt.textContent = o.name;
        orbitalIndexEl.appendChild(opt);
    });
    updateCounter();
    updateViz();
}

// ─── Prev / Next navigation ───────────────────────────────────────────────────
const btnPrev = document.getElementById('btn-prev') as HTMLButtonElement;
const btnNext = document.getElementById('btn-next') as HTMLButtonElement;
const orbitalCounter = document.getElementById('orbital-counter')!;

function updateCounter() {
    const total = orbitalIndexEl.options.length;
    const current = parseInt(orbitalIndexEl.value) + 1;
    orbitalCounter.textContent = `${current} / ${total}`;
}

function stepOrbital(delta: number) {
    const total = orbitalIndexEl.options.length;
    const next = (parseInt(orbitalIndexEl.value) + delta + total) % total;
    orbitalIndexEl.value = next.toString();
    updateCounter();
    updateViz();
}

btnPrev.onclick = () => stepOrbital(-1);
btnNext.onclick = () => stepOrbital(+1);

// ─── Event listeners ─────────────────────────────────────────────────────────
hybridTypeEl.addEventListener('change', populateOrbitalSelector);
orbitalIndexEl.addEventListener('change', () => { updateCounter(); updateViz(); });

btnScatter.onclick = () => {
    vizMode = 'scatter';
    btnScatter.classList.add('active');
    btnSurface.classList.remove('active');
    updateViz();
};
btnSurface.onclick = () => {
    vizMode = 'surface';
    btnSurface.classList.add('active');
    btnScatter.classList.remove('active');
    updateViz();
};

resetBtn.onclick = () => controls.reset();

window.addEventListener('resize', () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
});

// ─── Render loop ─────────────────────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// ─── Boot ────────────────────────────────────────────────────────────────────
populateOrbitalSelector();
updateCounter();
animate();
