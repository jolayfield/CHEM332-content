import './style.css';
import { initializeCapacitor } from './src/app-init';
import { initializeAppLifecycle } from './src/app-lifecycle';
import { initializeStorage } from './src/storage-manager';
import { setupMobileMenu } from './src/mobile-menu';
import { initializeTheme, toggleTheme } from './src/theme-manager';

console.log('QuantumChem Landing Page Loaded');

// Simulation category and item interfaces
interface Simulation {
  id: string;
  title: string;
  description: string;
  link: string;
}

interface Category {
  id: string;
  title: string;
  description: string;
  simulations: Simulation[];
}

// Define simulation categories with all content
const SIMULATION_CATEGORIES: Category[] = [
  {
    id: 'classical-failure',
    title: 'Failure of Classical Mechanics',
    description: 'Explore phenomena that classical physics cannot explain, leading to the development of quantum mechanics.',
    simulations: [
      {
        id: 'photoelectric',
        title: 'Photoelectric Effect',
        description: 'Experiment with light intensity and frequency to eject electrons from metals.',
        link: 'photoelectric.html'
      },
      {
        id: 'blackbody',
        title: 'Black Body Radiation',
        description: 'Observe how Planck\'s law explains the spectrum of thermal radiation and the ultraviolet catastrophe.',
        link: 'blackbody.html'
      }
    ]
  },
  {
    id: 'idealized-systems',
    title: 'Idealized Quantum Systems',
    description: 'Study simplified quantum systems that reveal fundamental principles of wave-particle behavior.',
    simulations: [
      {
        id: 'particlebox',
        title: 'Particle in a Box (1D)',
        description: 'Explore quantum wave functions and energy quantization in infinite potential wells.',
        link: 'particlebox.html'
      },
      {
        id: 'particlebox2d',
        title: 'Particle in a Box (2D)',
        description: 'Extend the particle in a box model to two dimensions with contour plot visualization.',
        link: 'particlebox2d.html'
      },
      {
        id: 'tunneling',
        title: 'Quantum Tunneling',
        description: 'Watch particles scatter through a finite potential barrier and observe tunneling.',
        link: 'barrier.html'
      }
    ]
  },
  {
    id: 'nuclear-spectroscopy',
    title: 'Nuclear Spectroscopy',
    description: 'Analyze vibrational, rotational, and combined vibrational-rotational spectra of molecules.',
    simulations: [
      {
        id: 'ir-spectra',
        title: 'Vibrational Spectra',
        description: 'Simulate IR vibrational spectra with varying molecular properties.',
        link: 'ir-spectra.html'
      },
      {
        id: 'rot-spectra',
        title: 'Rotational Spectra',
        description: 'Explore microwave rotational spectra and molecular rotation.',
        link: 'rot-spectra.html'
      },
      {
        id: 'vibrot-spectra',
        title: 'Vibrational-Rotational Spectra',
        description: 'Simulate combined P, Q, and R branches in molecular spectra.',
        link: 'vibrot-spectra.html'
      }
    ]
  },
  {
    id: 'atomic-systems',
    title: 'Atomic Systems',
    description: 'Investigate the structure of atoms, electron energy levels, and orbital shapes.',
    simulations: [
      {
        id: 'bohr',
        title: 'Bohr Model',
        description: 'Visualize electron orbits, energy transitions, and spectral lines.',
        link: 'bohr.html'
      },
      {
        id: 'orbitals',
        title: 'Atomic Orbitals',
        description: '3D probability density visualizations for Hydrogen-like atoms in your browser.',
        link: 'atomic-orbitals.html'
      },
      {
        id: 'hybridization',
        title: 'Orbital Hybridization',
        description: 'Explore sp, sp², and sp³ hybridization with orbital combinations.',
        link: 'hybridization.html'
      }
    ]
  },
  {
    id: 'molecular-systems',
    title: 'Molecular Systems',
    description: 'Understand molecular bonding through orbital diagrams and chemical structure.',
    simulations: [
      {
        id: 'mo-schemes',
        title: 'Diatomic MO Schemes',
        description: 'Build molecular orbital diagrams and determine bond properties of diatomic molecules.',
        link: 'mo-scheme.html'
      }
    ]
  }
  // Computational Chemistry section hidden for now
  // {
  //   id: 'computational-chemistry',
  //   title: 'Computational Chemistry',
  //   description: 'Explore the mathematical foundations of computational quantum chemistry and molecular modeling.',
  //   simulations: [
  //     {
  //       id: 'basis-set',
  //       title: 'Basis Set Visualization',
  //       description: 'Visualize Gaussian basis functions and their combinations in molecular orbital theory.',
  //       link: 'basis-set.html'
  //     }
  //   ]
  // }
];

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

/**
 * Render all category sections
 */
function renderCategories(): void {
  const container = document.getElementById('categories-container');
  if (!container) {
    console.error('categories-container not found');
    return;
  }

  SIMULATION_CATEGORIES.forEach((category) => {
    const section = createCategorySection(category);
    container.appendChild(section);
  });
}

/**
 * Create a category section with title, editable description, and simulation cards
 */
function createCategorySection(category: Category): HTMLElement {
  const section = document.createElement('section');
  section.className = 'category-section';

  // Create header with title and editable description
  const header = document.createElement('div');
  header.className = 'category-header';

  const title = document.createElement('h2');
  title.textContent = category.title;

  const description = document.createElement('p');
  description.className = 'category-description';
  description.textContent = category.description;

  header.appendChild(title);
  header.appendChild(description);

  // Create simulation cards grid
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'category-simulations';

  category.simulations.forEach((sim) => {
    const card = createSimulationCard(sim);
    cardsContainer.appendChild(card);
  });

  section.appendChild(header);
  section.appendChild(cardsContainer);

  return section;
}

/**
 * Create a single simulation card
 */
function createSimulationCard(sim: Simulation): HTMLElement {
  const card = document.createElement('div');
  card.className = 'glass-panel feature-card';

  const title = document.createElement('h3');
  title.textContent = sim.title;

  const description = document.createElement('p');
  description.textContent = sim.description;

  const link = document.createElement('a');
  link.href = sim.link;
  link.className = 'text-link';
  link.textContent = 'Launch →';

  card.appendChild(title);
  card.appendChild(description);
  card.appendChild(link);

  return card;
}

// Initialize theme and setup UI handlers
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  setupThemeToggle();
  setupMobileMenu();
  renderCategories();
});

/**
 * Setup theme toggle button click handler
 */
function setupThemeToggle(): void {
  const themeToggleBtn = document.querySelector('.theme-toggle') as HTMLElement;
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      toggleTheme();
    });
  }
}
