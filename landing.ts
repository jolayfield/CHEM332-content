import './style.css';
import { initializeCapacitor } from './src/app-init';
import { initializeAppLifecycle } from './src/app-lifecycle';
import { initializeStorage } from './src/storage-manager';

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

// Add interactive effects here if needed (e.g. scroll animations)
const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        (card as HTMLElement).style.transform = 'translateY(-5px)';
        (card as HTMLElement).style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
    });
    card.addEventListener('mouseleave', () => {
        (card as HTMLElement).style.transform = 'translateY(0)';
        (card as HTMLElement).style.boxShadow = 'none';
        (card as HTMLElement).style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.05)'; // Reset to glass default
    });
});
