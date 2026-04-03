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

/**
 * Gaussian basis function: exp(-α * x²)
 */
function gaussianBasis(x: number, alpha: number, center: number = 0): number {
  return Math.exp(-alpha * Math.pow(x - center, 2));
}

/**
 * Calculate overlap integral between two Gaussian basis functions
 * S = ∫ φ₁(x) * φ₂(x) dx
 */
function overlapIntegral(alpha1: number, alpha2: number, distance: number): number {
  const alpha_sum = alpha1 + alpha2;
  const exponent = (alpha1 * alpha2 * distance * distance) / alpha_sum;
  return Math.sqrt(Math.PI / alpha_sum) * Math.exp(-exponent);
}

/**
 * Get basis set parameters
 */
function getBasisSetParams(name: string): { exponents: number[]; coefficients: number[] } {
  switch (name) {
    case 'sto3g':
      // STO-3G: 3 Gaussians approximating Slater orbital
      return {
        exponents: [0.1688554, 0.6239137, 3.425251],
        coefficients: [0.4446345, 0.5353281, 0.1543290]
      };
    case '631g':
      // 6-31G: Simplified basis
      return {
        exponents: [0.1688554, 0.6239137, 3.425251, 11.0],
        coefficients: [0.4446345, 0.5353281, 0.1543290, 0.05]
      };
    case 'ccpvdz':
      // cc-pVDZ: Correlation-consistent basis
      return {
        exponents: [0.1688554, 0.6239137, 3.425251, 11.0, 50.0],
        coefficients: [0.3386465, 0.4853909, 0.1543290, 0.0385457, 0.0065627]
      };
    default:
      return {
        exponents: [0.1688554, 0.6239137, 3.425251],
        coefficients: [0.4446345, 0.5353281, 0.1543290]
      };
  }
}

/**
 * Draw the basis set visualization
 */
function drawBasisSet(
  canvas: HTMLCanvasElement,
  basisSetName: string,
  numBasis: number,
  customAlpha: number,
  showOverlap: boolean
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--glass-bg').trim();
  ctx.fillRect(0, 0, width, height);

  // Setup coordinates
  const xMin = -3;
  const xMax = 3;
  const yMin = 0;
  const yMax = 1.2;

  // Draw axes
  drawAxes(ctx, width, height, xMin, xMax, yMin, yMax);

  // Get basis set parameters
  const params = getBasisSetParams(basisSetName);
  const exponents = params.exponents.slice(0, numBasis).map(exp => exp * customAlpha);

  // Colors for different basis functions
  const colors = ['#b84dcd', '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'];
  const padding = { left: width * 0.1, right: width * 0.1, bottom: height * 0.15, top: height * 0.1 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Draw individual basis functions
  for (let i = 0; i < exponents.length; i++) {
    ctx.strokeStyle = colors[i % colors.length];
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();

    for (let ix = 0; ix <= 200; ix++) {
      const x = xMin + (xMax - xMin) * (ix / 200);
      const y = gaussianBasis(x, exponents[i]);

      const canvasX = padding.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
      const canvasY = height - padding.bottom - ((y - yMin) / (yMax - yMin)) * plotHeight;

      if (ix === 0) {
        ctx.moveTo(canvasX, canvasY);
      } else {
        ctx.lineTo(canvasX, canvasY);
      }
    }
    ctx.stroke();
  }

  // Draw linear combination (molecular orbital)
  ctx.strokeStyle = '#b84dcd';
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 1;
  ctx.beginPath();

  for (let ix = 0; ix <= 200; ix++) {
    const x = xMin + (xMax - xMin) * (ix / 200);
    let y = 0;

    // Sum basis functions with equal coefficients
    for (let i = 0; i < exponents.length; i++) {
      y += gaussianBasis(x, exponents[i]);
    }

    const canvasX = padding.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
    const canvasY = height - padding.bottom - ((y - yMin) / (yMax - yMin)) * plotHeight;

    if (ix === 0) {
      ctx.moveTo(canvasX, canvasY);
    } else {
      ctx.lineTo(canvasX, canvasY);
    }
  }
  ctx.stroke();

  // Add legend
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim();
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Linear Combination (purple, thick)', padding.left + 10, height - padding.bottom + 35);

  // Show overlap integrals if requested
  if (showOverlap && exponents.length > 1) {
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-dim').trim();
    ctx.font = '11px sans-serif';
    let yPos = padding.top + 20;

    for (let i = 0; i < exponents.length; i++) {
      for (let j = i + 1; j < exponents.length; j++) {
        const S = overlapIntegral(exponents[i], exponents[j], 0);
        ctx.fillText(`S(φ${i + 1},φ${j + 1}) = ${S.toFixed(3)}`, padding.left + 10, yPos);
        yPos += 18;
      }
    }
  }
}

/**
 * Draw axes and labels
 */
function drawAxes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number
): void {
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-main').trim();
  ctx.fillStyle = textColor;
  ctx.strokeStyle = textColor;
  ctx.font = '12px sans-serif';

  const padding = { left: width * 0.1, right: width * 0.1, bottom: height * 0.15, top: height * 0.1 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // X-axis
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  // Y-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.stroke();

  // X-axis labels
  const xLabels = ['-3', '-1.5', '0', '1.5', '3'];
  const xPositions = [0, 0.25, 0.5, 0.75, 1.0];

  xPositions.forEach((pos, idx) => {
    const x = padding.left + plotWidth * pos;
    ctx.fillText(xLabels[idx], x - 8, height - padding.bottom + 20);
  });

  // Y-axis labels
  const yLabels = ['0', '0.4', '0.8', '1.2'];
  const yPositions = [1, 0.67, 0.33, 0];

  yPositions.forEach((pos, idx) => {
    const y = height - padding.bottom - plotHeight * pos;
    ctx.fillText(yLabels[idx], padding.left - 30, y + 4);
  });

  // Axis labels
  ctx.fillText('Position', width * 0.5, height - 5);
  ctx.save();
  ctx.translate(12, height * 0.5);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Amplitude', 0, 0);
  ctx.restore();
}

document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  setupThemeToggle();
  setupMobileMenu();

  const canvas = document.getElementById('basis-chart') as HTMLCanvasElement;
  const basisSetSelect = document.getElementById('basis-set') as HTMLSelectElement;
  const basisCountInput = document.getElementById('basis-count') as HTMLInputElement;
  const basisCountVal = document.getElementById('basis-count-val') as HTMLElement;
  const exponentInput = document.getElementById('exponent') as HTMLInputElement;
  const exponentVal = document.getElementById('exponent-val') as HTMLElement;
  const showOverlapCheckbox = document.getElementById('show-overlap') as HTMLInputElement;
  const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
  const currentBasisDisplay = document.getElementById('current-basis') as HTMLElement;
  const basisFunctionsDisplay = document.getElementById('basis-functions') as HTMLElement;
  const currentExponentDisplay = document.getElementById('current-exponent') as HTMLElement;

  // Set canvas size
  if (canvas) {
    canvas.width = canvas.offsetWidth;
    canvas.height = 400;
  }

  const updateDisplay = () => {
    const basisSet = basisSetSelect.value;
    const numBasis = parseInt(basisCountInput.value);
    const alpha = parseFloat(exponentInput.value);
    const showOverlap = showOverlapCheckbox.checked;

    // Update text displays
    basisCountVal.textContent = `${numBasis}`;
    exponentVal.textContent = `${alpha.toFixed(1)}`;
    currentBasisDisplay.textContent = basisSetSelect.options[basisSetSelect.selectedIndex].text;
    basisFunctionsDisplay.textContent = `${numBasis}`;
    currentExponentDisplay.textContent = `${alpha.toFixed(1)}`;

    // Redraw basis set
    if (canvas) {
      drawBasisSet(canvas, basisSet, numBasis, alpha, showOverlap);
    }
  };

  // Event listeners
  basisSetSelect.addEventListener('change', updateDisplay);
  basisCountInput.addEventListener('input', updateDisplay);
  exponentInput.addEventListener('input', updateDisplay);
  showOverlapCheckbox.addEventListener('change', updateDisplay);

  resetBtn.addEventListener('click', () => {
    basisSetSelect.value = 'sto3g';
    basisCountInput.value = '3';
    exponentInput.value = '1.5';
    showOverlapCheckbox.checked = true;
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
