import './style.css';
import { initializeTheme, toggleTheme } from './src/theme-manager';
import { setupMobileMenu } from './src/mobile-menu';

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

// Physical constants
const h = 6.62607015e-34; // Planck constant (J·s)
const c = 299792458; // Speed of light (m/s)
const k_B = 1.380649e-23; // Boltzmann constant (J/K)

/**
 * Calculate spectral radiance using Planck's Law
 * @param wavelength - Wavelength in meters
 * @param temperature - Temperature in Kelvin
 * @returns Spectral radiance in W/(m³·sr)
 */
function plancksLaw(wavelength: number, temperature: number): number {
  const numerator = 2 * h * c * c / Math.pow(wavelength, 5);
  const exponent = (h * c) / (wavelength * k_B * temperature);
  const denominator = Math.exp(exponent) - 1;
  return numerator / denominator;
}

/**
 * Calculate Wien's displacement constant
 * @param temperature - Temperature in Kelvin
 * @returns Peak wavelength in meters
 */
function wiensPeakWavelength(temperature: number): number {
  const wien = 2.897771955e-3; // Wien's displacement constant (m·K)
  return wien / temperature;
}

/**
 * Draw the black body radiation spectrum
 */
function drawSpectrum(canvas: HTMLCanvasElement, temperature: number, mode: 'wavelength' | 'frequency'): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--glass-bg').trim();
  ctx.fillRect(0, 0, width, height);

  // Calculate spectrum data
  const dataPoints = 500;
  const wavelengthMin = 100e-9; // 100 nm
  const wavelengthMax = 2500e-9; // 2500 nm

  // Find peak for normalization
  const peakWavelength = wiensPeakWavelength(temperature);
  const peakRadiance = plancksLaw(peakWavelength, temperature);

  // Draw grid and axes
  drawAxes(ctx, width, height, mode, wavelengthMin, wavelengthMax);

  // Draw spectrum curve
  ctx.strokeStyle = '#b84dcd';
  ctx.lineWidth = 2;
  ctx.beginPath();

  for (let i = 0; i < dataPoints; i++) {
    const wavelength = wavelengthMin + (wavelengthMax - wavelengthMin) * (i / dataPoints);
    const radiance = plancksLaw(wavelength, temperature);
    const normalizedRadiance = radiance / peakRadiance;

    const x = (width * 0.1) + (width * 0.8) * (i / dataPoints);
    const y = height * 0.85 - (height * 0.7) * Math.min(normalizedRadiance, 1);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();

  // Highlight visible light region (380-700 nm)
  const visibleMin = 380e-9;
  const visibleMax = 700e-9;
  const xVisibleMin = (width * 0.1) + (width * 0.8) * ((visibleMin - wavelengthMin) / (wavelengthMax - wavelengthMin));
  const xVisibleMax = (width * 0.1) + (width * 0.8) * ((visibleMax - wavelengthMin) / (wavelengthMax - wavelengthMin));

  ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
  ctx.fillRect(xVisibleMin, 0, xVisibleMax - xVisibleMin, height);

  // Mark peak wavelength
  const xPeak = (width * 0.1) + (width * 0.8) * ((peakWavelength - wavelengthMin) / (wavelengthMax - wavelengthMin));
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(xPeak, 0);
  ctx.lineTo(xPeak, height);
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Draw axes and labels
 */
function drawAxes(ctx: CanvasRenderingContext2D, width: number, height: number, mode: 'wavelength' | 'frequency', min: number, max: number): void {
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim();
  ctx.fillStyle = textColor;
  ctx.strokeStyle = textColor;
  ctx.font = '12px sans-serif';

  // X-axis
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width * 0.1, height * 0.85);
  ctx.lineTo(width * 0.9, height * 0.85);
  ctx.stroke();

  // Y-axis
  ctx.beginPath();
  ctx.moveTo(width * 0.1, height * 0.15);
  ctx.lineTo(width * 0.1, height * 0.85);
  ctx.stroke();

  // X-axis labels
  const labels = mode === 'wavelength' ? ['100', '500', '1000', '1500', '2000', '2500'] : ['3e14', '6e14', '9e14'];
  const positions = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

  positions.forEach((pos, idx) => {
    if (idx < labels.length) {
      const x = width * 0.1 + width * 0.8 * pos;
      ctx.fillText(labels[idx], x - 15, height * 0.9);
    }
  });

  // Axis labels
  ctx.fillText(mode === 'wavelength' ? 'Wavelength (nm)' : 'Frequency (Hz)', width * 0.45, height * 0.98);
  ctx.save();
  ctx.translate(15, height * 0.5);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Spectral Radiance', 0, 0);
  ctx.restore();
}

document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  setupThemeToggle();
  setupMobileMenu();

  const canvas = document.getElementById('spectrum-chart') as HTMLCanvasElement;
  const temperatureInput = document.getElementById('temperature') as HTMLInputElement;
  const temperatureVal = document.getElementById('temperature-val') as HTMLElement;
  const wavelengthModeSelect = document.getElementById('wavelength-mode') as HTMLSelectElement;
  const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
  const peakWavelengthDisplay = document.getElementById('peak-wavelength') as HTMLElement;
  const currentTempDisplay = document.getElementById('current-temp') as HTMLElement;

  // Set canvas size
  if (canvas) {
    canvas.width = canvas.offsetWidth;
    canvas.height = 400;
  }

  const updateDisplay = () => {
    const temperature = parseInt(temperatureInput.value);
    const mode = wavelengthModeSelect.value as 'wavelength' | 'frequency';

    // Update text displays
    temperatureVal.textContent = `${temperature} K`;
    currentTempDisplay.textContent = `${temperature}`;

    // Calculate and display peak wavelength
    const peakWavelength = wiensPeakWavelength(temperature);
    peakWavelengthDisplay.textContent = (peakWavelength * 1e9).toFixed(1);

    // Redraw spectrum
    if (canvas) {
      drawSpectrum(canvas, temperature, mode);
    }
  };

  // Event listeners
  temperatureInput.addEventListener('input', updateDisplay);
  wavelengthModeSelect.addEventListener('change', updateDisplay);

  resetBtn.addEventListener('click', () => {
    temperatureInput.value = '5000';
    updateDisplay();
  });

  // Initial draw
  updateDisplay();

  // Handle window resize
  window.addEventListener('resize', () => {
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      updateDisplay();
    }
  });
});
