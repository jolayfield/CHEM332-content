/**
 * App Lifecycle Management
 * Handles pause/resume events and resource cleanup
 */

import { App } from '@capacitor/app';

// Track if app is active
let isAppActive = true;

// Store animation frame IDs for cleanup
const animationFrameIds: Set<number> = new Set();

/**
 * Initialize app lifecycle handlers
 */
export function initializeAppLifecycle(): void {
  App.addListener('pause', handleAppPause);
  App.addListener('resume', handleAppResume);
  App.addListener('destroy', handleAppDestroy);

  // Set initial state
  isAppActive = true;
}

/**
 * Handle app pause event (app backgrounded)
 * - Pause animations
 * - Save state
 * - Reduce resource usage
 */
function handleAppPause(): void {
  isAppActive = false;
  console.log('App paused');

  // Pause all Three.js animations
  pauseThreeJsAnimations();

  // Pause Chart.js animations if any
  pauseChartAnimations();

  // Emit custom event for other components to handle
  window.dispatchEvent(new CustomEvent('appPaused'));
}

/**
 * Handle app resume event (app foregrounded)
 * - Resume animations
 * - Restore state
 */
function handleAppResume(): void {
  isAppActive = true;
  console.log('App resumed');

  // Resume Three.js animations
  resumeThreeJsAnimations();

  // Emit custom event for other components to handle
  window.dispatchEvent(new CustomEvent('appResumed'));
}

/**
 * Handle app destroy event (app closing)
 * - Cleanup resources
 * - Save final state
 */
function handleAppDestroy(): void {
  console.log('App destroying');

  // Clean up all animation frames
  animationFrameIds.forEach(id => cancelAnimationFrame(id));
  animationFrameIds.clear();

  // Emit custom event
  window.dispatchEvent(new CustomEvent('appDestroying'));
}

/**
 * Pause Three.js animations
 * Looks for canvas elements and pauses any Three.js scenes
 */
function pauseThreeJsAnimations(): void {
  try {
    // Find all canvas elements
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      // Mark canvas as needing pause (simulation code should check this flag)
      (canvas as any).__shouldPause = true;
    });
  } catch (error) {
    console.debug('Could not pause Three.js animations:', error);
  }
}

/**
 * Resume Three.js animations
 */
function resumeThreeJsAnimations(): void {
  try {
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      (canvas as any).__shouldPause = false;
    });
  } catch (error) {
    console.debug('Could not resume Three.js animations:', error);
  }
}

/**
 * Pause Chart.js animations
 */
function pauseChartAnimations(): void {
  try {
    // This would require access to Chart.js instances
    // For now, we rely on simulations to handle this via custom event
    window.dispatchEvent(new CustomEvent('pauseCharts'));
  } catch (error) {
    console.debug('Could not pause Chart animations:', error);
  }
}

/**
 * Check if app is currently active
 */
export function isAppRunning(): boolean {
  return isAppActive;
}

/**
 * Register an animation frame for cleanup on app destroy
 */
export function registerAnimationFrame(id: number): void {
  animationFrameIds.add(id);
}

/**
 * Unregister an animation frame
 */
export function unregisterAnimationFrame(id: number): void {
  animationFrameIds.delete(id);
}
