// Hydrogen-like atom wavefunction mathematics
// Constants
const a0 = 1.0; // Bohr radius (normalized for visualization)

/**
 * Factorial function
 */
function factorial(n: number): number {
    if (n <= 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

/**
 * Associated Laguerre Polynomial L^a_n(x)
 * Source: https://en.wikipedia.org/wiki/Laguerre_polynomials#Associated_Laguerre_polynomials
 */
function associatedLaguerre(n: number, a: number, x: number): number {
    if (n === 0) return 1;
    if (n === 1) return 1 + a - x;

    // Recurrence relation: (n+1)L^a_{n+1}(x) = (2n+1+a-x)L^a_n(x) - (n+a)L^a_{n-1}(x)
    let l_prev = 1;
    let l_curr = 1 + a - x;

    for (let i = 1; i < n; i++) {
        const l_next = ((2 * i + 1 + a - x) * l_curr - (i + a) * l_prev) / (i + 1);
        l_prev = l_curr;
        l_curr = l_next;
    }

    return l_curr;
}

/**
 * Associated Legendre Polynomial P^m_l(x), WITHOUT the Condon–Shortley
 * phase (-1)^m. Dropping it gives the chemistry real-harmonic convention in
 * which p_x ∝ x, d_xz ∝ xz, etc. are positive where the polynomial is positive.
 */
function associatedLegendre(l: number, m: number, x: number): number {
    // Basic implementation for low l, m or general recurrence
    // abs(m) must be <= l
    m = Math.abs(m);

    // p_mm
    let pmm = 1.0;
    if (m > 0) {
        const somx2 = Math.sqrt((1.0 - x) * (1.0 + x));
        let fact = 1.0;
        for (let i = 1; i <= m; i++) {
            pmm *= fact * somx2;
            fact += 2.0;
        }
    }

    if (l === m) return pmm;

    // p_mm+1
    let pmmp1 = x * (2.0 * m + 1.0) * pmm;

    if (l === m + 1) return pmmp1;

    // Recurrence for higher l
    let pll = 0.0;
    for (let ll = m + 2; ll <= l; ll++) {
        pll = (x * (2.0 * ll - 1.0) * pmmp1 - (ll + m - 1.0) * pmm) / (ll - m);
        pmm = pmmp1;
        pmmp1 = pll;
    }

    return pmmp1;
}

/**
 * Radial part of the Hydrogen-like wavefunction
 * associatedLaguerre() uses the modern convention (L^a_1 = 1 + a − x), so the
 * normalization is √[(2Z/na₀)³ (n−l−1)! / (2n (n+l)!)] — not the older
 * (n+l)!³ form, which belongs to the unnormalized Laguerre convention.
 * Satisfies ∫₀^∞ R_nl(r)² r² dr = 1.
 */
export function radialPart(n: number, l: number, Z: number, r: number): number {
    const rho = (2.0 * Z * r) / (n * a0);
    const normalization = Math.sqrt(
        Math.pow((2.0 * Z) / (n * a0), 3) *
        (factorial(n - l - 1) / (2.0 * n * factorial(n + l)))
    );

    return normalization * Math.exp(-rho / 2.0) * Math.pow(rho, l) * associatedLaguerre(n - l - 1, 2 * l + 1, rho);
}

/**
 * Real Spherical Harmonic Y_lm(theta, phi)
 * m > 0 → cos(mφ) combinations, m < 0 → sin(|m|φ), no Condon–Shortley phase.
 * See REAL_ORBITAL_NAMES for the Cartesian label of each (l, m).
 */
export function angularPart(l: number, m: number, theta: number, phi: number): number {
    const absM = Math.abs(m);
    const normalization = Math.sqrt(
        ((2 * l + 1) / (4 * Math.PI)) * (factorial(l - absM) / factorial(l + absM))
    );

    const legendre = associatedLegendre(l, absM, Math.cos(theta));
    const raw = normalization * legendre;

    if (m === 0) return raw;
    if (m > 0) return Math.sqrt(2) * raw * Math.cos(m * phi);
    return Math.sqrt(2) * raw * Math.sin(absM * phi);
}

/**
 * Probability density |psi|^2 at (r, theta, phi)
 */
export function getProbabilityDensity(n: number, l: number, m: number, Z: number, r: number, theta: number, phi: number): number {
    const psi = radialPart(n, l, Z, r) * angularPart(l, m, theta, phi);
    return psi * psi;
}

/**
 * Wavefunction value psi at (r, theta, phi)
 */
export function getWavefunction(n: number, l: number, m: number, Z: number, r: number, theta: number, phi: number): number {
    return radialPart(n, l, Z, r) * angularPart(l, m, theta, phi);
}

/**
 * Cartesian names of the real orbitals drawn by angularPart(), indexed by l then m.
 * Each is positive where the named polynomial is positive.
 */
const REAL_ORBITAL_NAMES: Record<number, Record<number, string>> = {
    0: { 0: 's' },
    1: { [-1]: 'p_y', 0: 'p_z', 1: 'p_x' },
    2: { [-2]: 'd_{xy}', [-1]: 'd_{yz}', 0: 'd_{z^2}', 1: 'd_{xz}', 2: 'd_{x^2-y^2}' },
    3: {
        [-3]: 'f_{y(3x^2-y^2)}', [-2]: 'f_{xyz}', [-1]: 'f_{yz^2}', 0: 'f_{z^3}',
        1: 'f_{xz^2}', 2: 'f_{z(x^2-y^2)}', 3: 'f_{x(x^2-3y^2)}'
    }
};

/**
 * LaTeX name of the real orbital, e.g. "3d_{xy}"
 */
export function realOrbitalName(n: number, l: number, m: number): string {
    return `${n}${REAL_ORBITAL_NAMES[l]?.[m] ?? '?'}`;
}

/**
 * Radius (in a₀) enclosing `fraction` of the radial probability ∫ R² r² dr.
 * Used to size the view box to the orbital (which scales as ~n²/Z).
 */
export function radialExtent(n: number, l: number, Z: number, fraction: number = 0.995): number {
    const rMax = (4 * n * n + 20) / Z;
    const steps = 4000;
    const dr = rMax / steps;
    let cumulative = 0;
    for (let i = 1; i <= steps; i++) {
        const r = (i - 0.5) * dr;
        const R = radialPart(n, l, Z, r);
        cumulative += R * R * r * r * dr;
        if (cumulative >= fraction) return i * dr;
    }
    return rMax;
}
