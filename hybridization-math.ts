/**
 * Hybridization Mathematics
 *
 * Linear combinations of atomic orbitals (LCAO) to form hybrid orbitals
 * Normalized wavefunctions for sp, sp2, and sp3 hybridization
 */

/**
 * Represents a hybrid orbital as a linear combination of s and p orbitals
 */
export interface HybridOrbital {
    name: string;
    coefficients: {
        s: number;
        px: number;
        py: number;
        pz: number;
    };
    geometry: string;
    angle: number;
}

/**
 * Get hybrid orbitals for a given hybridization type
 */
export function getHybridOrbitalSet(hybridization: 'sp' | 'sp2' | 'sp3'): HybridOrbital[] {
    switch (hybridization) {
        case 'sp':
            return getSpHybrids();
        case 'sp2':
            return getSp2Hybrids();
        case 'sp3':
            return getSp3Hybrids();
    }
}

/**
 * SP Hybridization: Linear geometry
 * 2 hybrid orbitals at 180° angles
 *
 * h1 = (1/√2)|s⟩ + (1/√2)|pz⟩
 * h2 = (1/√2)|s⟩ - (1/√2)|pz⟩
 */
function getSpHybrids(): HybridOrbital[] {
    const coeff = 1 / Math.sqrt(2);
    return [
        {
            name: 'SP Hybrid 1',
            coefficients: { s: coeff, px: 0, py: 0, pz: coeff },
            geometry: 'Linear',
            angle: 180
        },
        {
            name: 'SP Hybrid 2',
            coefficients: { s: coeff, px: 0, py: 0, pz: -coeff },
            geometry: 'Linear',
            angle: 180
        }
    ];
}

/**
 * SP2 Hybridization: Trigonal planar geometry
 * 3 hybrid orbitals at 120° angles
 *
 * h1 = (1/√3)|s⟩ + √(2/3)|pz⟩
 * h2 = (1/√3)|s⟩ - (1/√6)|pz⟩ + (1/√2)|px⟩
 * h3 = (1/√3)|s⟩ - (1/√6)|pz⟩ - (1/√2)|px⟩
 */
function getSp2Hybrids(): HybridOrbital[] {
    const coeffS = 1 / Math.sqrt(3);
    const coeffPz1 = Math.sqrt(2 / 3);
    const coeffPz23 = -1 / Math.sqrt(6);
    const coeffPx = 1 / Math.sqrt(2);

    return [
        {
            name: 'SP2 Hybrid 1',
            coefficients: { s: coeffS, px: 0, py: 0, pz: coeffPz1 },
            geometry: 'Trigonal Planar',
            angle: 120
        },
        {
            name: 'SP2 Hybrid 2',
            coefficients: { s: coeffS, px: coeffPx, py: 0, pz: coeffPz23 },
            geometry: 'Trigonal Planar',
            angle: 120
        },
        {
            name: 'SP2 Hybrid 3',
            coefficients: { s: coeffS, px: -coeffPx, py: 0, pz: coeffPz23 },
            geometry: 'Trigonal Planar',
            angle: 120
        }
    ];
}

/**
 * SP3 Hybridization: Tetrahedral geometry
 * 4 hybrid orbitals at 109.47° angles
 *
 * h1 = (1/2)(|s⟩ + |px⟩ + |py⟩ + |pz⟩)
 * h2 = (1/2)(|s⟩ + |px⟩ - |py⟩ - |pz⟩)
 * h3 = (1/2)(|s⟩ - |px⟩ + |py⟩ - |pz⟩)
 * h4 = (1/2)(|s⟩ - |px⟩ - |py⟩ + |pz⟩)
 */
function getSp3Hybrids(): HybridOrbital[] {
    const coeff = 0.5;
    return [
        {
            name: 'SP3 Hybrid 1',
            coefficients: { s: coeff, px: coeff, py: coeff, pz: coeff },
            geometry: 'Tetrahedral',
            angle: 109.47
        },
        {
            name: 'SP3 Hybrid 2',
            coefficients: { s: coeff, px: coeff, py: -coeff, pz: -coeff },
            geometry: 'Tetrahedral',
            angle: 109.47
        },
        {
            name: 'SP3 Hybrid 3',
            coefficients: { s: coeff, px: -coeff, py: coeff, pz: -coeff },
            geometry: 'Tetrahedral',
            angle: 109.47
        },
        {
            name: 'SP3 Hybrid 4',
            coefficients: { s: coeff, px: -coeff, py: -coeff, pz: coeff },
            geometry: 'Tetrahedral',
            angle: 109.47
        }
    ];
}

/**
 * Simple orbital wavefunction models for visualization
 * These are simplified Slater-type orbitals (normalized Gaussian-like)
 */

/**
 * S orbital wavefunction (1s): e^(-ζr)
 * Normalized Gaussian: (ζ/π)^(3/4) * e^(-ζr²)
 */
export function sOrbital(x: number, y: number, z: number, zeta: number = 1.0): number {
    const r2 = x * x + y * y + z * z;
    const coeff = Math.pow(zeta / Math.PI, 0.75);
    return coeff * Math.exp(-zeta * r2);
}

/**
 * Px orbital wavefunction: x * e^(-ζr²)
 */
export function pxOrbital(x: number, y: number, z: number, zeta: number = 1.0): number {
    const r2 = x * x + y * y + z * z;
    const coeff = Math.pow(zeta / Math.PI, 0.75) * Math.sqrt(3 * zeta);
    return coeff * x * Math.exp(-zeta * r2);
}

/**
 * Py orbital wavefunction: y * e^(-ζr²)
 */
export function pyOrbital(x: number, y: number, z: number, zeta: number = 1.0): number {
    const r2 = x * x + y * y + z * z;
    const coeff = Math.pow(zeta / Math.PI, 0.75) * Math.sqrt(3 * zeta);
    return coeff * y * Math.exp(-zeta * r2);
}

/**
 * Pz orbital wavefunction: z * e^(-ζr²)
 */
export function pzOrbital(x: number, y: number, z: number, zeta: number = 1.0): number {
    const r2 = x * x + y * y + z * z;
    const coeff = Math.pow(zeta / Math.PI, 0.75) * Math.sqrt(3 * zeta);
    return coeff * z * Math.exp(-zeta * r2);
}

/**
 * Calculate the wavefunction value for a hybrid orbital
 * as a linear combination of s and p orbitals
 */
export function hybridOrbitalWavefunction(
    x: number,
    y: number,
    z: number,
    hybrid: HybridOrbital,
    zeta: number = 1.0
): number {
    const s = sOrbital(x, y, z, zeta);
    const px = pxOrbital(x, y, z, zeta);
    const py = pyOrbital(x, y, z, zeta);
    const pz = pzOrbital(x, y, z, zeta);

    return (
        hybrid.coefficients.s * s +
        hybrid.coefficients.px * px +
        hybrid.coefficients.py * py +
        hybrid.coefficients.pz * pz
    );
}

/**
 * Calculate probability density |ψ|²
 */
export function hybridOrbitalDensity(
    x: number,
    y: number,
    z: number,
    hybrid: HybridOrbital,
    zeta: number = 1.0
): number {
    const psi = hybridOrbitalWavefunction(x, y, z, hybrid, zeta);
    return psi * psi;
}

/**
 * Get formatted LaTeX for hybrid orbital equation
 */
export function getHybridEquation(hybrid: HybridOrbital): string {
    const c = hybrid.coefficients;
    const terms: string[] = [];

    // Axis remapping to chemistry convention:
    //   Three.js X (internal px) → displayed as p_y  (horizontal)
    //   Three.js Y (internal py) → displayed as p_z  (vertical)
    //   Three.js Z (internal pz) → displayed as p_x  (out of plane)
    if (Math.abs(c.s) > 0.001) {
        terms.push(`${formatCoeff(c.s)}|s\\rangle`);
    }
    if (Math.abs(c.pz) > 0.001) {
        terms.push(`${formatCoeff(c.pz)}|p_x\\rangle`);
    }
    if (Math.abs(c.px) > 0.001) {
        terms.push(`${formatCoeff(c.px)}|p_y\\rangle`);
    }
    if (Math.abs(c.py) > 0.001) {
        terms.push(`${formatCoeff(c.py)}|p_z\\rangle`);
    }

    return terms.join(' + ').replace(/\+ -/g, '- ');
}

/**
 * Format coefficient for display
 */
function formatCoeff(coeff: number): string {
    const abs = Math.abs(coeff);
    const sign = coeff < 0 ? '- ' : '';

    // Check for common fractions and square roots
    if (Math.abs(abs - 0.5) < 0.001) return `${sign}\\frac{1}{2}`;
    if (Math.abs(abs - 1 / Math.sqrt(2)) < 0.001) return `${sign}\\frac{1}{\\sqrt{2}}`;
    if (Math.abs(abs - Math.sqrt(2 / 3)) < 0.001) return `${sign}\\sqrt{\\frac{2}{3}}`;
    if (Math.abs(abs - 1 / Math.sqrt(3)) < 0.001) return `${sign}\\frac{1}{\\sqrt{3}}`;
    if (Math.abs(abs - 1 / Math.sqrt(6)) < 0.001) return `${sign}\\frac{1}{\\sqrt{6}}`;
    if (Math.abs(abs - 1 / Math.sqrt(2)) < 0.001) return `${sign}\\frac{1}{\\sqrt{2}}`;

    return `${sign}${abs.toFixed(3)}`;
}

/**
 * Get the composition percentages for each orbital
 */
export function getOrbitalComposition(hybrid: HybridOrbital): { s: number; p: number } {
    const c = hybrid.coefficients;
    const sPercent = Math.round((c.s * c.s) * 100);
    const pPercent = Math.round((c.px * c.px + c.py * c.py + c.pz * c.pz) * 100);
    return { s: sPercent, p: pPercent };
}
