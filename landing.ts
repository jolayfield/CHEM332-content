import './style.css';
import { initializeCapacitor } from './src/app-init';
import { initializeAppLifecycle } from './src/app-lifecycle';
import { initializeStorage } from './src/storage-manager';
import { setupMobileMenu } from './src/mobile-menu';

console.log('QuantumChem Landing Page Loaded');

// Initialize Capacitor plugins, lifecycle handlers, and storage
// This runs on all platforms (web and mobile)
async function initializeApp(): Promise<void> {
  try {
    await initializeCapacitor();
  } catch (error) {
    console.warn('Capacitor initialization skipped (likely running on web):', error);
  }

  try {
    initializeAppLifecycle();
  } catch (error) {
    console.warn('App lifecycle initialization skipped:', error);
  }

  try {
    await initializeStorage();
  } catch (error) {
    console.warn('Storage initialization failed:', error);
  }
}

initializeApp();

// Setup mobile menu after initialization
setupMobileMenu();
