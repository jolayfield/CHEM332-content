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
 * Calculate spectral radiance using Planck's Law (wavelength form)
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
 * Calculate spectral radiance using Rayleigh-Jeans Law (wavelength form)
 * @param wavelength - Wavelength in meters
 * @param temperature - Temperature in Kelvin
 * @returns Spectral radiance in W/(m³·sr)
 */
function rayleighJeansLawWavelength(wavelength: number, temperature: number): number {
  return (2 * c * k_B * temperature) / Math.pow(wavelength, 4);
}

/**
 * Calculate spectral radiance using Planck's Law (frequency form)
 * @param frequency - Frequency in Hz
 * @param temperature - Temperature in Kelvin
 * @returns Spectral radiance in W/(m²·sr·Hz)
 */
function plancksLawFrequency(frequency: number, temperature: number): number {
  const numerator = 2 * h * Math.pow(frequency, 3) / (c * c);
  const exponent = (h * frequency) / (k_B * temperature);
  const denominator = Math.exp(exponent) - 1;
  return numerator / denominator;
}

/**
 * Calculate spectral radiance using Rayleigh-Jeans Law (frequency form)
 * @param frequency - Frequency in Hz
 * @param temperature - Temperature in Kelvin
 * @returns Spectral radiance in W/(m²·sr·Hz)
 */
function rayleighJeansLawFrequency(frequency: number, temperature: number): number {
  return (2 * Math.pow(frequency, 2) * k_B * temperature) / (c * c);
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
function drawSpectrum(canvas: HTMLCanvasElement, temperature: number, mode: 'wavelength' | 'frequency', showRayleighJeans: boolean): void {
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

  // Draw grid and axes
  drawAxes(ctx, width, height, mode, wavelengthMin, wavelengthMax);

  if (mode === 'wavelength') {
    // Find peak for normalization
    const peakWavelength = wiensPeakWavelength(temperature);
    const peakRadiance = plancksLaw(peakWavelength, temperature);

    // Draw Planck's law curve
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

    // Draw Rayleigh-Jeans law if enabled
    if (showRayleighJeans) {
      ctx.strokeStyle = '#4da6ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();

      for (let i = 0; i < dataPoints; i++) {
        const wavelength = wavelengthMin + (wavelengthMax - wavelengthMin) * (i / dataPoints);
        const radiance = rayleighJeansLawWavelength(wavelength, temperature);
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
      ctx.setLineDash([]);
    }

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
  } else {
    // Frequency mode
    const frequencyMin = 0; // Start at zero
    const frequencyMax = c / wavelengthMin; // Higher frequency (smaller wavelength)

    // Find peak radiance for normalization
    let peakRadiance = 0;
    for (let i = 0; i < dataPoints; i++) {
      const frequency = frequencyMin + (frequencyMax - frequencyMin) * (i / dataPoints);
      const radiance = plancksLawFrequency(frequency, temperature);
      peakRadiance = Math.max(peakRadiance, radiance);
    }

    // Draw Planck's law curve
    ctx.strokeStyle = '#b84dcd';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < dataPoints; i++) {
      const frequency = frequencyMin + (frequencyMax - frequencyMin) * (i / dataPoints);
      const radiance = plancksLawFrequency(frequency, temperature);
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

    // Draw Rayleigh-Jeans law if enabled
    if (showRayleighJeans) {
      ctx.strokeStyle = '#4da6ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();

      for (let i = 0; i < dataPoints; i++) {
        const frequency = frequencyMin + (frequencyMax - frequencyMin) * (i / dataPoints);
        const radiance = rayleighJeansLawFrequency(frequency, temperature);
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
      ctx.setLineDash([]);
    }
  }
}

/**
 * Draw axes and labels
 */
function drawAxes(ctx: CanvasRenderingContext2D, width: number, height: number, mode: 'wavelength' | 'frequency', wavelengthMin: number, wavelengthMax: number): void {
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

  // X-axis labels and title
  let labels: string[];
  let positions: number[];

  if (mode === 'wavelength') {
    labels = ['100', '500', '1000', '1500', '2000', '2500'];
    positions = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
  } else {
    // Frequency mode: from 0 to max frequency
    const frequencyMax = c / wavelengthMin;
    labels = [
      '0',
      ((frequencyMax * 0.2) * 1e-14).toFixed(1),
      ((frequencyMax * 0.4) * 1e-14).toFixed(1),
      ((frequencyMax * 0.6) * 1e-14).toFixed(1),
      ((frequencyMax * 0.8) * 1e-14).toFixed(1),
      (frequencyMax * 1e-14).toFixed(1)
    ];
    positions = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
  }

  positions.forEach((pos, idx) => {
    if (idx < labels.length) {
      const x = width * 0.1 + width * 0.8 * pos;
      ctx.fillText(labels[idx], x - 20, height * 0.9);
    }
  });

  // X-axis title
  const xAxisTitle = mode === 'wavelength' ? 'Wavelength (nm)' : 'Frequency (×10¹⁴ Hz)';
  ctx.fillText(xAxisTitle, width * 0.45, height * 0.98);

  // Y-axis label
  ctx.save();
  ctx.translate(15, height * 0.5);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Spectral Radiance (normalized)', 0, 0);
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
  const rayleighJeansToggle = document.getElementById('rayleigh-jeans-toggle') as HTMLInputElement;
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
    const showRayleighJeans = rayleighJeansToggle.checked;

    // Update text displays
    temperatureVal.textContent = `${temperature} K`;
    currentTempDisplay.textContent = `${temperature}`;

    // Calculate and display peak wavelength
    const peakWavelength = wiensPeakWavelength(temperature);
    peakWavelengthDisplay.textContent = (peakWavelength * 1e9).toFixed(1);

    // Redraw spectrum
    if (canvas) {
      drawSpectrum(canvas, temperature, mode, showRayleighJeans);
    }
  };

  // Event listeners
  temperatureInput.addEventListener('input', updateDisplay);
  wavelengthModeSelect.addEventListener('change', updateDisplay);
  rayleighJeansToggle.addEventListener('change', updateDisplay);

  resetBtn.addEventListener('click', () => {
    temperatureInput.value = '5000';
    rayleighJeansToggle.checked = false;
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
