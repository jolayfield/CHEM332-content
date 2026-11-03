/**
 * Keyboard and button control for the 3D orbital views.
 *
 * OrbitControls' built-in keys pan rather than rotate and have no zoom keys, and a
 * window-level listener would take arrow keys away from sliders. So the focusable
 * container gets its own handler: arrows rotate the camera about the target,
 * + and - zoom, and visible buttons do the same for mouse and touch users
 * (WCAG 2.5.7: an alternative to drag). Preset views put the camera on each
 * chemistry axis. Chemistry axes map to three.js as X → +Z, Y → +X, Z → +Y.
 */
import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const ROTATE_STEP = 0.08;   // radians per key press or button press
const ZOOM_STEP = 0.9;      // distance factor per zoom press
const POLE_EPSILON = 0.02;  // keep the camera off the poles, where OrbitControls degenerates

export interface CameraSetup {
  container: HTMLElement;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  /** Accessible name for the focusable 3D region */
  label: string;
  /** Where the "oblique" preset returns the camera (the page's starting view) */
  obliquePosition: THREE.Vector3;
}

/** Camera position for a preset view, at the given distance, in three.js coordinates. */
function presetPosition(view: 'x' | 'y' | 'z', distance: number): THREE.Vector3 {
  // Off-axis offset for Z so the camera does not sit exactly on the pole
  switch (view) {
    case 'x': return new THREE.Vector3(0, 0, distance);                       // chem X → three +Z
    case 'y': return new THREE.Vector3(distance, 0, 0);                       // chem Y → three +X
    case 'z': return new THREE.Vector3(0.001 * distance, distance, 0.001 * distance); // chem Z → three +Y
  }
}

function rotate(setup: CameraSetup, dTheta: number, dPhi: number): void {
  const { camera, controls } = setup;
  const offset = camera.position.clone().sub(controls.target);
  const spherical = new THREE.Spherical().setFromVector3(offset);
  spherical.theta -= dTheta;
  spherical.phi = Math.min(Math.PI - POLE_EPSILON, Math.max(POLE_EPSILON, spherical.phi - dPhi));
  camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
  camera.lookAt(controls.target);
  controls.update();
}

function zoom(setup: CameraSetup, factor: number): void {
  const { camera, controls } = setup;
  const offset = camera.position.clone().sub(controls.target).multiplyScalar(factor);
  camera.position.copy(controls.target).add(offset);
  controls.update();
}

function moveTo(setup: CameraSetup, position: THREE.Vector3): void {
  const { camera, controls } = setup;
  camera.position.copy(controls.target).add(position.clone().sub(controls.target));
  camera.lookAt(controls.target);
  controls.update();
}

/** Keyboard handling on the focusable container. */
function handleKey(setup: CameraSetup, e: KeyboardEvent): void {
  switch (e.key) {
    case 'ArrowLeft':  rotate(setup, -ROTATE_STEP, 0); break;
    case 'ArrowRight': rotate(setup, ROTATE_STEP, 0); break;
    case 'ArrowUp':    rotate(setup, 0, ROTATE_STEP); break;
    case 'ArrowDown':  rotate(setup, 0, -ROTATE_STEP); break;
    case '+':
    case '=':          zoom(setup, ZOOM_STEP); break;
    case '-':
    case '_':          zoom(setup, 1 / ZOOM_STEP); break;
    default: return;
  }
  e.preventDefault();
}

function button(label: string, text: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'qc-chip';
  b.textContent = text;
  b.setAttribute('aria-label', label);
  b.addEventListener('click', onClick);
  return b;
}

/**
 * Wire keyboard control, visible step buttons, and preset view buttons to a 3D
 * view. Call once after the renderer canvas is appended and the controls exist.
 */
export function setupCameraControls(setup: CameraSetup, resetAnchor: HTMLElement): void {
  const { container, camera, controls } = setup;

  // Focusable, named region. Not role="application": that would swallow screen-reader browse keys.
  container.tabIndex = 0;
  container.setAttribute('role', 'group');
  container.setAttribute('aria-label', setup.label);
  container.addEventListener('keydown', (e: KeyboardEvent) => handleKey(setup, e));

  // Visible controls: step buttons and preset views (mouse, touch, and assistive tech)
  const panel = document.createElement('div');
  panel.className = 'three-controls';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', '3D view controls');
  panel.style.display = 'flex';
  panel.style.flexWrap = 'wrap';
  panel.style.gap = '6px';
  panel.style.margin = '8px 0';

  panel.appendChild(button('Rotate left', '←', () => rotate(setup, -ROTATE_STEP, 0)));
  panel.appendChild(button('Rotate up', '↑', () => rotate(setup, 0, ROTATE_STEP)));
  panel.appendChild(button('Rotate down', '↓', () => rotate(setup, 0, -ROTATE_STEP)));
  panel.appendChild(button('Rotate right', '→', () => rotate(setup, ROTATE_STEP, 0)));
  panel.appendChild(button('Zoom in', '+', () => zoom(setup, ZOOM_STEP)));
  panel.appendChild(button('Zoom out', '−', () => zoom(setup, 1 / ZOOM_STEP)));

  const distance = () => camera.position.clone().sub(controls.target).length();
  panel.appendChild(button('View along chemistry X', 'View along X', () => moveTo(setup, presetPosition('x', distance()))));
  panel.appendChild(button('View along chemistry Y', 'View along Y', () => moveTo(setup, presetPosition('y', distance()))));
  panel.appendChild(button('View along chemistry Z', 'View along Z', () => moveTo(setup, presetPosition('z', distance()))));
  panel.appendChild(button('Oblique view', 'Oblique', () => moveTo(setup, setup.obliquePosition.clone().normalize().multiplyScalar(distance()))));

  resetAnchor.parentElement?.insertBefore(panel, resetAnchor);
}

/** Text alternative for a WebGL canvas: role img, labelled by visually hidden text. */
export function describeWebGLCanvas(canvas: HTMLCanvasElement, id: string, text: string): void {
  const desc = document.createElement('p');
  desc.id = id;
  desc.className = 'sr-only';
  desc.textContent = text;
  canvas.parentElement?.insertBefore(desc, canvas);
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-labelledby', id);
}
