/** Rydberg constant for hydrogen (m⁻¹) */
export const R_H = 1.09678e7;

/**
 * Photon wavelength (nm) for an ni ↔ nf transition in hydrogen:
 * 1/λ = R_H (1/n_lower² − 1/n_upper²). Returns Infinity when ni === nf.
 */
export function transitionWavelengthNm(ni: number, nf: number): number {
    const invLambda = R_H * Math.abs(1 / (nf * nf) - 1 / (ni * ni)); // m⁻¹
    return invLambda === 0 ? Infinity : 1e9 / invLambda;
}

/** Visible window used for coloring photons (nm) */
export const VISIBLE_MIN_NM = 380;
export const VISIBLE_MAX_NM = 750;

/**
 * Approximate sRGB color for a visible wavelength (380–750 nm), after
 * Dan Bruton's piecewise-linear fit, with intensity roll-off near the
 * edges of human vision. Returns null outside the visible range.
 */
export function wavelengthToColor(nm: number): string | null {
    if (nm < VISIBLE_MIN_NM || nm > VISIBLE_MAX_NM) return null;
    let r = 0, g = 0, b = 0;
    if (nm < 440)      { r = -(nm - 440) / (440 - 380); b = 1; }
    else if (nm < 490) { g = (nm - 440) / (490 - 440); b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / (510 - 490); }
    else if (nm < 580) { r = (nm - 510) / (580 - 510); g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / (645 - 580); }
    else               { r = 1; }

    // Dim toward the UV / IR limits of vision (floor keeps lines visible on dark bg)
    let f = 1;
    if (nm < 420) f = 0.3 + 0.7 * (nm - 380) / (420 - 380);
    else if (nm > 700) f = 0.3 + 0.7 * (750 - nm) / (750 - 700);
    f = Math.max(f, 0.55);

    const to255 = (c: number) => Math.round(255 * Math.pow(c * f, 0.8));
    return `rgb(${to255(r)},${to255(g)},${to255(b)})`;
}

export type OrbitScale = 'true' | 'schematic';

export class BohrSimulation {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;

    // State
    n: number = 3; // Start at n=3
    targetN: number | null = null;
    transitionProgress: number = 0;
    waitingForAbsorption: boolean = false; // New state for absorption

    electronAngle: number = 0;

    // Photons: { x, y, vx, vy, color, visible, band, life, totalLife, waviness, type: 'emission'|'absorption' }
    photons: any[] = [];

    // Resolves the Promise returned by transitionTo() once the electron settles
    private onTransitionDone: ((completed: boolean) => void) | null = null;

    // Orbit radius mode: 'true' → r ∝ n², 'schematic' → evenly spaced (not to scale)
    orbitScale: OrbitScale = 'true';

    // Constants
    maxN: number = 6;
    outerRadius: number = 120; // radius of the n = maxN orbit (px), set on resize
    gridCanvas: HTMLCanvasElement | null = null;
    elementSymbol: string = 'H';
    elementZ: number = 1;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("2D context not found");
        this.ctx = ctx;

        this.width = canvas.width;
        this.height = canvas.height;

        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    handleResize() {
        if (this.canvas.parentElement) {
            this.canvas.width = this.canvas.parentElement.clientWidth;
            this.canvas.height = this.canvas.parentElement.clientHeight;
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            // Outermost orbit fits the smaller canvas dimension with a margin for labels
            this.outerRadius = Math.max(40, Math.min(this.width, this.height) / 2 - 22);
            this.buildGrid();
        }
    }

    buildGrid() {
        const canvasBg = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim() || '#0a0612';
        const gc = document.createElement('canvas');
        gc.width = this.width;
        gc.height = this.height;
        const gctx = gc.getContext('2d')!;
        gctx.fillStyle = canvasBg;
        gctx.fillRect(0, 0, gc.width, gc.height);
        gctx.strokeStyle = 'rgba(255,255,255,0.05)';
        gctx.lineWidth = 0.5;
        gctx.beginPath();
        for (let x = 0; x <= this.width; x += 24) { gctx.moveTo(x, 0); gctx.lineTo(x, this.height); }
        for (let y = 0; y <= this.height; y += 24) { gctx.moveTo(0, y); gctx.lineTo(this.width, y); }
        gctx.stroke();
        this.gridCanvas = gc;
    }

    getRadius(n: number): number {
        const N = this.maxN;
        // True scale: r_n = n² a₀ / Z, normalized so the n = maxN orbit fills the canvas
        if (this.orbitScale === 'true') return this.outerRadius * (n * n) / (N * N);
        // Schematic: evenly spaced orbits (NOT to scale)
        return this.outerRadius * n / N;
    }

    /**
     * Angular speed (rad/frame) of the electron in orbit n.
     * Bohr theory: v ∝ 1/n and r ∝ n², so ω = v/r ∝ 1/n³. Taken literally the
     * n = 6 electron would be 216× slower than n = 1 and look frozen, so the
     * speed is clamped to a minimum that still reads as motion.
     */
    getAngularSpeed(n: number): number {
        return Math.max(0.1 / (n * n * n), 0.005);
    }

    get busy(): boolean {
        return this.targetN !== null || this.waitingForAbsorption;
    }

    /**
     * Start a transition to finalN. Resolves true when the electron has
     * settled in the new orbit, or false immediately if the request was
     * rejected (already busy, or finalN equals the current level).
     */
    transitionTo(finalN: number): Promise<boolean> {
        if (this.busy) return Promise.resolve(false);
        if (finalN === this.n) return Promise.resolve(false);

        this.targetN = finalN;
        const done = new Promise<boolean>(resolve => { this.onTransitionDone = resolve; });

        // Emission (High -> Low): Electron jumps immediately, photon emitted during/after? 
        // Typically emission is instantaneous with jump.
        if (finalN < this.n) {
            this.emitPhoton(this.n, finalN);
            this.transitionProgress = 0;
        }

        // Absorption (Low -> High): Photon comes in FIRST, then electron jumps.
        if (finalN > this.n) {
            this.absorbPhoton(this.n, finalN);
            this.waitingForAbsorption = true; // Wait for photon to hit
            this.transitionProgress = 0;
        }
        return done;
    }

    /**
     * Photon appearance from its true wavelength. Visible lines get their
     * spectral color; UV (Lyman) and IR (Paschen, Brackett, Pfund) photons
     * are invisible, so they are drawn neutral grey + dashed and labelled.
     */
    getPhotonStyle(ni: number, nf: number): { color: string; visible: boolean; band: string } {
        const nm = transitionWavelengthNm(ni, nf);
        const color = wavelengthToColor(nm);
        if (color) return { color, visible: true, band: '' };
        return { color: 'rgba(200,200,210,0.75)', visible: false, band: nm < VISIBLE_MIN_NM ? 'UV' : 'IR' };
    }

    absorbPhoton(ni: number, nf: number) {
        const style = this.getPhotonStyle(ni, nf);
        const r = this.getRadius(ni); // Target radius (current orbit)

        // Calculate time to impact
        // Photon speed = 3.5
        // Distance from spawn to target
        const spawnDist = Math.max(this.width, this.height) / 1.5;
        const speed = 3.5;

        // Time to travel from spawnDist to r
        // dist = spawnDist - r
        const distToTravel = spawnDist - r;
        const framesToImpact = distToTravel / speed;

        // Where will the electron be in framesToImpact?
        const angularVelocity = this.getAngularSpeed(ni);
        // Electron moves counter-clockwise (positive angle)
        const futureAngle = this.electronAngle + angularVelocity * framesToImpact;

        // Spawn point is at futureAngle, distance spawnDist
        // We want it to come from OUTSIDE, so same angle as target but further out.
        const sx = this.width / 2 + Math.cos(futureAngle) * spawnDist;
        const sy = this.height / 2 + Math.sin(futureAngle) * spawnDist;

        // Target point is at futureAngle, distance r (electron position at impact)
        const tx = this.width / 2 + Math.cos(futureAngle) * r;
        const ty = this.height / 2 + Math.sin(futureAngle) * r;

        // Velocity vector pointing to target (inward)
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.photons.push({
            x: sx,
            y: sy,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            ...style,
            life: 1000,
            totalLife: 1000,
            waviness: 0,
            type: 'absorption'
        });
    }

    emitPhoton(ni: number, nf: number) {
        const style = this.getPhotonStyle(ni, nf);

        // Spawn at electron position
        const radius = this.getRadius(this.n);
        const ex = this.width / 2 + Math.cos(this.electronAngle) * radius;
        const ey = this.height / 2 + Math.sin(this.electronAngle) * radius;

        // Shoot outwards from center
        const angle = Math.atan2(ey - this.height / 2, ex - this.width / 2);
        const speed = 3.5; // Halfway speed

        this.photons.push({
            x: ex,
            y: ey,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            ...style,
            life: 200,
            totalLife: 200,
            waviness: 0,
            type: 'emission'
        });
    }

    update() {
        // Orbit
        let currentEffectiveN = this.n;

        // If waiting for absorption, we don't transition n yet.
        if (this.targetN !== null && !this.waitingForAbsorption) {
            this.transitionProgress += 0.015; // Halfway speed

            // Lerp N for drawing radius
            const t = this.easeInOutQuad(this.transitionProgress);
            currentEffectiveN = this.n + (this.targetN - this.n) * t;

            if (this.transitionProgress >= 1) {
                this.n = this.targetN;
                this.targetN = null;
                this.transitionProgress = 0;
                const cb = this.onTransitionDone;
                this.onTransitionDone = null;
                cb?.(true);
            }
        }

        this.electronAngle += this.getAngularSpeed(currentEffectiveN);

        // Photons
        for (let i = this.photons.length - 1; i >= 0; i--) {
            const p = this.photons[i];
            p.x += p.vx;
            p.y += p.vy;
            p.waviness += 0.35; // Slightly faster waviness too

            if (p.type === 'emission') {
                p.life--;
                if (p.life <= 0) this.photons.splice(i, 1);
            } else if (p.type === 'absorption') {
                // Check collision with center/orbit
                const dx = p.x - this.width / 2;
                const dy = p.y - this.height / 2;
                const d = Math.sqrt(dx * dx + dy * dy);
                const r = this.getRadius(this.n);

                // If photon reaches the orbit radius
                if (d <= r) {
                    // Trigger jump!
                    this.waitingForAbsorption = false;
                    this.photons.splice(i, 1);
                }
            }
        }
    }

    draw() {
        const ctx = this.ctx;

        // Dark background + grid
        if (this.gridCanvas) {
            ctx.drawImage(this.gridCanvas, 0, 0);
        } else {
            const canvasBg = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim() || '#0a0612';
            ctx.fillStyle = canvasBg;
            ctx.fillRect(0, 0, this.width, this.height);
        }

        const cx = this.width / 2;
        const cy = this.height / 2;

        // Draw Orbits
        // n= labels sit just right of each orbit; in true-scale mode the inner
        // orbits are tightly packed, so skip labels that would overlap.
        const labelMinGap = 24;
        let lastLabelX = Infinity;
        for (let i = this.maxN; i >= 1; i--) {
            const r = this.getRadius(i);
            const isActive = (i === this.n) || (!this.waitingForAbsorption && i === this.targetN);
            const isTarget = this.waitingForAbsorption && i === this.targetN;

            ctx.beginPath();
            if (isActive) {
                ctx.strokeStyle = '#c8892a';
                ctx.lineWidth = 1.2;
                ctx.setLineDash([]);
            } else if (isTarget) {
                ctx.strokeStyle = 'rgba(200,137,42,0.6)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
            } else {
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 0.6;
                ctx.setLineDash([2, 3]);
            }
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // n= label
            const lx = cx + r + 4;
            if (lastLabelX - lx >= labelMinGap && r > 10) {
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '600 9px Lato, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`n=${i}`, lx, cy + 4);
                lastLabelX = lx;
            }
        }

        // Nucleus: shrink so it never hides the n = 1 orbit in true-scale mode
        const r1 = this.getRadius(1);
        const nucleusR = Math.min(6, r1 * 0.6);

        // Nucleus glow ring
        if (r1 > 14) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,179,71,0.35)';
            ctx.lineWidth = 0.6;
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Nucleus
        ctx.beginPath();
        ctx.fillStyle = '#ffb347';
        ctx.shadowColor = '#ffb347';
        ctx.shadowBlur = 8;
        ctx.arc(cx, cy, nucleusR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;


        // Draw Electron
        // Radius depends on transition state
        let r = this.getRadius(this.n);
        if (this.targetN !== null && !this.waitingForAbsorption) {
            const t = this.easeInOutQuad(this.transitionProgress);
            const r1 = this.getRadius(this.n);
            const r2 = this.getRadius(this.targetN);
            r = r1 + (r2 - r1) * t;
        }

        const ex = cx + Math.cos(this.electronAngle) * r;
        const ey = cy + Math.sin(this.electronAngle) * r;

        ctx.beginPath();
        ctx.fillStyle = '#7cc4ff';
        ctx.shadowColor = '#7cc4ff';
        ctx.shadowBlur = 15;
        ctx.arc(ex, ey, Math.min(5, Math.max(2.5, r1 * 0.8)), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Bottom-left element label
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '600 9px Lato, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Z = ${this.elementZ} · ${this.elementSymbol.toUpperCase()}`, 12, this.height - 10);

        // Bottom-right scale label
        ctx.textAlign = 'right';
        ctx.fillText(this.orbitScale === 'true' ? 'TRUE SCALE · r ∝ n²' : 'SCHEMATIC · NOT TO SCALE',
            this.width - 12, this.height - 10);

        // Draw Photons (Sine wave packet)
        this.photons.forEach(p => {
            ctx.beginPath();
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.visible ? 3 : 2;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.visible ? 8 : 0;
            ctx.lineCap = 'round';
            ctx.setLineDash(p.visible ? [] : [4, 4]);

            // Draw a sine wave segment oriented along velocity
            const angle = Math.atan2(p.vy, p.vx);
            const packetLen = 40;
            const freq = 0.4;
            const amp = 6;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(angle);

            ctx.moveTo(-packetLen / 2, 0);
            for (let x = -packetLen / 2; x <= packetLen / 2; x += 2) {
                const phase = p.waviness;
                const distFromCenter = Math.abs(x);
                const envelope = Math.max(0, 1 - distFromCenter / (packetLen / 2));
                const y = Math.sin(x * freq - phase) * amp * envelope;
                ctx.lineTo(x, y);
            }

            ctx.stroke();
            ctx.restore();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;

            // UV / IR tag for invisible photons
            if (!p.visible) {
                ctx.fillStyle = 'rgba(255,255,255,0.75)';
                ctx.font = '600 10px Lato, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(p.band, p.x, p.y - 12);
            }
        });
    }

    loop() {
        if (!document.hidden) {
            this.update();
            this.draw();
        }
        requestAnimationFrame(this.loop);
    }

    easeInOutQuad(t: number): number {
        return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
}
